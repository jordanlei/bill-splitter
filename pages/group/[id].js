import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { ref, onValue, push, remove, update, set, get } from "firebase/database";
import { db } from "../../firebase";
import Layout from "../../components/layout";
import Card from "../../components/card";
import Dropdown from "../../components/dropdown";

const selectedcolor = "#0058b7";
const unselectedcolor = "#aaaaaa";

const addData = (path, data) => {
  push(ref(db, path), data).catch(console.error);
};

const updateData = (path, data) => {
  update(ref(db, path), data).catch(console.error);
};

const removeData = (path) => {
  remove(ref(db, path)).catch(console.error);
};

const useGroupData = (id) => {
  const [group, setGroup] = useState(null);

  useEffect(() => {
    if (!id) return;
    const groupRef = ref(db, `groups/${id}`);
    const unsubscribe = onValue(groupRef, (snapshot) =>
      setGroup(snapshot.val())
    );
    return () => unsubscribe();
  }, [id]);

  return group;
};

const calculateBalances = (group) => {
  const balances = {};

  group.members.forEach((member) => {
    balances[member] = {};
    group.members.forEach((otherMember) => {
      if (member !== otherMember) {
        balances[member][otherMember] = 0;
      }
    });
  });

  if (group.expenses) {
    Object.values(group.expenses).forEach((expense) => {
      if (expense.items) {
        Object.values(expense.items).forEach((item) => {
          if (item.assignedMembers) {
            const itemSplitAmount =
              item.amount / (item.assignedMembers.length || 1);
            item.assignedMembers.forEach((member) => {
              if (member !== expense.payer) {
                balances[member][expense.payer] -= itemSplitAmount;
                balances[expense.payer][member] += itemSplitAmount;
              }
            });
          }
        });
      }
    });
  }

  if (group.payments) {
    Object.values(group.payments).forEach((payment) => {
      balances[payment.from][payment.to] += payment.amount;
      balances[payment.to][payment.from] -= payment.amount;
    });
  }

  return balances;
};

const getCurrentDate = () => new Date().toISOString().split("T")[0];

const CreateExpenseForm = ({ params }) => {
  const {
    group,
    groupId,
    showForm,
    setShowForm,
    participants,
    setParticipants,
  } = params;
  useEffect(() => {
    setParticipants(group.members);
  }, [group.members, setParticipants]);

  if (showForm == "addExpense") {
    return (
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const newExpense = {
              timestamp: new Date(e.target.date.value).getTime(),
              amount: e.target.amount.value,
              payer: e.target.payer.value,
              description: e.target.description.value || "Untitled Expense",
              items: [],
              participants,
            };
            addData(`groups/${groupId}/expenses`, newExpense);
            setShowForm(null);
            setParticipants(group.members);
          }}
        >
          <select name="payer" required>
            <option value="">Who Paid?</option>
            {group.members.map((member, index) => (
              <option key={index} value={member}>
                {member}
              </option>
            ))}
          </select>
          <div>
            Who was there?
            <br />
            {group.members.sort().map((member, index) => (
              <button
                key={index}
                type="button"
                style={{
                  color: "white",
                  backgroundColor: participants.includes(member)
                    ? selectedcolor
                    : unselectedcolor,
                  marginRight: "5px",
                }}
                onClick={() => {
                  setParticipants((prev) =>
                    prev.includes(member)
                      ? prev.filter((m) => m !== member)
                      : [...prev, member]
                  );
                }}
              >
                {member}
                {participants.includes(member) ? " ✓" : " "}
              </button>
            ))}
          </div>
          <br />
          <input
            type="text"
            name="description"
            placeholder="Description (Optional)"
          />
          <br />
          <input
            type="number"
            name="amount"
            step="0.01"
            placeholder="Total Expense ($)"
            required
          />
          <br />
          <input
            type="date"
            name="date"
            defaultValue={getCurrentDate()}
            required
          />
          <br />
          <button type="submit">Submit</button>
          <button
            style={{ backgroundColor: "red", float: "right" }}
            onClick={() => setShowForm(null)}
          >
            Cancel
          </button>
        </form>
      </Card>
    );
  } else if (showForm != "addPayment") {
    return (
      <button onClick={() => setShowForm("addExpense")}>New Expense</button>
    );
  }
};

const ExpenseCard = ({ params }) => {
  const totalItemsAmount = params.expense.items
    ? Object.values(params.expense.items).reduce(
        (sum, item) => sum + item.amount,
        0
      )
    : 0;
  const remainder = params.expense.amount - totalItemsAmount;

  return (
    <Card>
      <div className="row">
        <div className="col-sm-4">
          <h4 style={{ opacity: "50%" }}>
            {new Date(params.expense.timestamp)
              .toISOString()
              .split("T")[0]
              .replace(/-/g, "/")}
          </h4>
          <h1>${parseFloat(params.expense.amount).toFixed(2)}</h1>
        </div>
        <div className="col-sm-8">
          <div style={{ position: "relative" }}>
            <h3>
              {params.expense.payer} paid for {params.expense.description}
            </h3>

            {remainder != 0 && (
              <>
                Remaining Cost: ${remainder.toFixed(2)}
                <br />
              </>
            )}

            {params.expense.items && (
              <Dropdown showText="Show Line Items" hideText="Hide Line Items">
                {Object.entries(params.expense.items).map(([itemId, item]) => (
                  <ItemCard params={{ ...params, itemId, item }} />
                ))}
              </Dropdown>
            )}

            {params.showForm === params.expenseId ? (
              <CreateItemForm params={{ ...params }} />
            ) : (
              <div>
                <button
                  onClick={() => {
                    params.setShowForm(null);
                    params.setItemDescription("");
                    params.setItemAmount("");
                    params.setAssignedMembers([]);
                    return params.setShowForm(params.expenseId);
                  }}
                >
                  New Line Item
                </button>
              </div>
            )}
            {remainder > 0 && (
              <div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const newItem = {
                      description: "Remainder",
                      amount: remainder,
                      timestamp: Date.now(),
                      assignedMembers: params.expense.participants,
                    };
                    addData(
                      `groups/${params.groupId}/expenses/${params.expenseId}/items`,
                      newItem
                    );
                    params.setShowForm(null);
                  }}
                >
                  <button type="submit">Split Remainder Evenly</button>
                </form>
              </div>
            )}
            {remainder > 0 && params.expense.items && (
              <div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Check if any items have no assigned members
                    if (
                      params.expense.items &&
                      Object.values(params.expense.items).some(
                        (item) =>
                          !item.assignedMembers ||
                          item.assignedMembers.length === 0
                      )
                    ) {
                      alert(
                        "All items must have assigned members before splitting the remainder."
                      );
                      return;
                    }

                    // Calculate the total amount assigned to each member
                    const memberTotals = {};
                    params.group.members.forEach((member) => {
                      memberTotals[member] = 0;
                    });

                    Object.values(params.expense.items).forEach((item) => {
                      const itemSplitAmount =
                        item.amount / (item.assignedMembers.length || 1);
                      item.assignedMembers.forEach((member) => {
                        memberTotals[member] += itemSplitAmount;
                      });
                    });

                    const totalAssigned = Object.values(memberTotals).reduce(
                      (sum, amount) => sum + amount,
                      0
                    );

                    // Add a new item for each member based on their proportion of the total assigned amount
                    params.group.members.forEach((member) => {
                      const proportion = memberTotals[member] / totalAssigned;
                      const memberRemainder = remainder * proportion;
                      const newItem = {
                        description: "Split Remainder",
                        amount: memberRemainder,
                        timestamp: Date.now(),
                        assignedMembers: [member],
                      };
                      addData(
                        `groups/${params.groupId}/expenses/${params.expenseId}/items`,
                        newItem
                      );
                    });

                    params.setShowForm(null);
                  }}
                >
                  <button type="submit">Split Remainder Proportionally</button>
                </form>
              </div>
            )}
            <span style={{ fontSize: "15px", opacity: "50%" }}>
              Attendees: {params.expense.participants.join(", ")}
              <br />
            </span>
          </div>
        </div>
        <div className="col-sm-1">
          <button
            style={{ position: "absolute", top: "10px", right: "10px" }}
            onClick={() => {
              removeData(
                `groups/${params.groupId}/expenses/${params.expenseId}`
              );
            }}
          >
            X
          </button>
        </div>
      </div>
    </Card>
  );
};

const ItemCard = ({ params }) => {
  const { itemId, item } = params;

  return (
    <Card key={itemId}>
      <div className="row">
        <div className="col-sm-8">
          ${item.amount.toFixed(2)} for {item.description}
          <br />
          <i>
            {item.assignedMembers
              ? item.assignedMembers.join(", ")
              : "[Assign]"}
          </i>
        </div>
        <div className="col-sm-4">
          <button
            style={{ marginRight: "5px", float: "right" }}
            onClick={() => {
              removeData(
                `groups/${params.groupId}/expenses/${params.expenseId}/items/${itemId}`
              );
            }}
          >
            &ndash;
          </button>
          <button
            style={{
              marginRight: "5px",
              float: "right",
            }}
            onClick={() => {
              params.setShowForm(`edit-${itemId}`);
              params.setItemDescription(item.description);
              params.setItemAmount(item.amount);
              params.setAssignedMembers(item.assignedMembers || []);
            }}
          >
            Edit
          </button>
        </div>
      </div>
      {params.showForm === `edit-${itemId}` && (
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const updatedItem = {
                description: params.itemDescription || item.description,
                amount: parseFloat(params.itemAmount) || item.amount,
                assignedMembers: params.assignedMembers || [],
              };
              updateData(
                `groups/${params.groupId}/expenses/${params.expenseId}/items/${itemId}`,
                updatedItem
              );
              params.setShowForm(null);
              params.setItemDescription("");
              params.setItemAmount("");
              params.setAssignedMembers([]);
            }}
          >
            <div>
              Assign to:
              <br />
              {params.group.members.sort().map((member, index) => (
                <button
                  key={index}
                  type="button"
                  style={{
                    color: "white",
                    marginRight: "5px",
                    backgroundColor: params.assignedMembers.includes(member)
                      ? selectedcolor
                      : unselectedcolor,
                  }}
                  onClick={() => {
                    params.setAssignedMembers((prev) =>
                      prev.includes(member)
                        ? prev.filter((m) => m !== member)
                        : [...prev, member]
                    );
                  }}
                >
                  {member}
                  {params.assignedMembers.includes(member) ? " ✓" : " "}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Item description"
              value={params.itemDescription}
              onChange={(e) => params.setItemDescription(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={params.itemAmount}
              onChange={(e) => params.setItemAmount(e.target.value)}
            />
            <br />
            <button type="submit">Save</button>
            <button
              style={{ backgroundColor: "red", float: "right" }}
              onClick={() => params.setShowForm(null)}
            >
              Cancel
            </button>
          </form>
        </Card>
      )}
    </Card>
  );
};

const CreateItemForm = ({ params }) => {
  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // add the item
          params.handleAddItem(e, params.expenseId);
          // clear the item fields
          params.setItemDescription("");
          params.setItemAmount("");
          params.setAssignedMembers([]);
        }}
      >
        <div>
          Assign to:
          <br />
          {params.group.members.sort().map((member, index) => (
            <button
              key={index}
              type="button"
              style={{
                color: "white",
                marginRight: "5px",
                backgroundColor: params.assignedMembers.includes(member)
                  ? selectedcolor
                  : unselectedcolor,
              }}
              onClick={() => {
                params.setAssignedMembers((prev) =>
                  prev.includes(member)
                    ? prev.filter((m) => m !== member)
                    : [...prev, member]
                );
              }}
            >
              {member}
              {params.assignedMembers.includes(member) ? " ✓" : " "}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Item description"
          value={params.itemDescription}
          onChange={(e) => params.setItemDescription(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={params.itemAmount}
          onChange={(e) => params.setItemAmount(e.target.value)}
        />
        <br />
        <button type="submit">Submit</button>
        <button
          style={{ backgroundColor: "red", float: "right" }}
          onClick={() => params.setShowForm(null)}
        >
          Cancel
        </button>
      </form>
    </Card>
  );
};

const PaymentCard = ({ params }) => {
  const { groupId, payment, paymentId } = params;
  return (
    <Card>
      <div className="row">
        <div className="col-sm-4">
          <h4 style={{ opacity: "50%" }}>
            {new Date(payment.timestamp)
              .toISOString()
              .split("T")[0]
              .replace(/-/g, "/")}
          </h4>
          <h1>${payment.amount.toFixed(2)}</h1>
        </div>
        <div className="col-sm-8">
          <h3>
            {payment.from} paid {payment.to}
          </h3>
          <br />
        </div>
        <div className="col-sm-1">
          <button
            style={{ position: "absolute", top: "10px", right: "10px" }}
            onClick={() =>
              removeData(`groups/${groupId}/payments/${paymentId}`)
            }
          >
            X
          </button>
        </div>
      </div>
    </Card>
  );
};

const CreatePaymentForm = ({ params }) => {
  const { group, groupId, showForm, setShowForm } = params;
  if (showForm === "addPayment") {
    return (
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const CreatePaymentForm = {
              timestamp: new Date(
                `${e.target.date.value}T${
                  new Date().toTimeString().split(" ")[0]
                }`
              ).getTime(),
              amount: parseFloat(e.target.amount.value),
              from: e.target.from.value,
              to: e.target.to.value,
            };
            addData(`groups/${groupId}/payments`, CreatePaymentForm);
            setShowForm(null);
          }}
        >
          <select name="from" required>
            <option value="">From</option>
            {group.members.map((member, index) => (
              <option key={index} value={member}>
                {member}
              </option>
            ))}
          </select>
          <select name="to" required>
            <option value="">To</option>
            {group.members.map((member, index) => (
              <option key={index} value={member}>
                {member}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="amount"
            step="0.01"
            placeholder="Amount ($)"
            required
          />
          <input
            type="date"
            name="date"
            defaultValue={getCurrentDate()}
            required
          />
          <br />
          <button type="submit">Submit</button>
          <button
            style={{ backgroundColor: "red", float: "right" }}
            onClick={() => setShowForm(null)}
          >
            Cancel
          </button>
        </form>
      </Card>
    );
  } else if (showForm != "addExpense") {
    return <button onClick={() => setShowForm("addPayment")}>Record Payment</button>;
  }
};

const GroupPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const group = useGroupData(id);
  const [showForm, setShowForm] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [participants, setParticipants] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);
  if (!group) return <p>Loading group...</p>;

  const handleAddItem = (e, expenseId) => {
    e.preventDefault();
    const newItem = {
      description: itemDescription || "Untitled Item",
      amount: parseFloat(itemAmount) || 0,
      assignedMembers,
    };
    addData(`groups/${id}/expenses/${expenseId}/items`, newItem);
    setItemDescription("");
    setItemAmount("");
    setAssignedMembers([]);
    setShowForm(null);
  };

  var params = {
    groupId: id,
    group,
    showForm,
    setShowForm,
    itemDescription,
    setItemDescription,
    itemAmount,
    setItemAmount,
    participants,
    setParticipants,
    assignedMembers,
    setAssignedMembers,
    handleAddItem,
  };

  const balances = calculateBalances(group);

  const transactions = (
    (group.expenses &&
      Object.entries(group.expenses).map(([expenseId, expense]) => ({
        type: "expense",
        component: <ExpenseCard params={{ ...params, expense, expenseId }} />,
        timestamp: expense.timestamp,
      }))) ||
    []
  )
    .concat(
      (group.payments &&
        Object.entries(group.payments).map(([paymentId, payment]) => ({
          type: "payment",
          component: <PaymentCard params={{ ...params, payment, paymentId }} />,
          timestamp: payment.timestamp,
        }))) ||
        []
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((item) => item.component);

  return (
    <Layout>
      <div className="row container" style={{ paddingTop: "20px" }}>
        <div className="col-lg-4" style={{ paddingBottom: "30px" }}>
          <div style={{ paddingBottom: "30px" }}>
            <h1>
              <b>{group.name}</b>
            </h1>
            {group.members.join(", ")}<br/><br/>
            Share <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Group link copied to clipboard!");
              }}
            >
              this link
            </button> with your group!
            <Card>{window.location.href}</Card>
            
          </div>
          <div>
            <h3>
              <b>Balance</b>
            </h3>
            <Card>

            {transactions.length > 0 ? (
              Object.entries(balances).some(([member, balance]) =>
                Object.values(balance).some((amount) => amount < 0)
              ) ? (
                Object.entries(balances).map(([member, balance]) =>
                  Object.entries(balance).map(([otherMember, amount]) =>
                    amount < 0 ? (
                      <>
                        {member} owes {otherMember} ${(-amount).toFixed(2)}
                        <br />
                      </>
                    ) : null
                  )
                )
              ) : (
                <p>All clear!</p>
              )
            ) : (
                <div
                  style={{
                    height: "20vh",
                    padding: "10%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  Your balances will appear here once you add transactions.
                </div>
            )}
            </Card>
          </div>
        </div>
        <div className="col-lg-8">
          <CreateExpenseForm params={params} />{" "}
          <CreatePaymentForm params={params} />
          {transactions.length > 0 ? (
            transactions
          ) : (
            <Card>
              <div
                style={{
                  height: "30vh",
                  padding: "10%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                There are no transactions yet. To get started, add an expense.
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export async function getServerSideProps({ params }) {
  try {
    // Access the database and fetch the group data
    const dbRef = ref(db, `groups/${params.id}`); // Reference to the group
    const snapshot = await get(dbRef); // Use get() instead of once()

    if (!snapshot.exists()) {
      console.log("I didnt' find this group!")
      return { notFound: true };  // Handle missing data
    }
    
    const groupData = snapshot.val();  // Extract data

    return {
      props: {
        groupData, // Pass the data to the page
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        groupData: null,  // Handle error gracefully
      },
    };
  }
}

export default GroupPage;
