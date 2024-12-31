import { useRouter } from "next/router";
// pages/create.js
import { useState } from "react";
import { ref, push, set } from "firebase/database";
import { db } from "../firebase";
import Layout from "../components/layout";
import Card from "../components/card";
import Link from 'next/link';

const Home = () => {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [members, setMembers] = useState([""]);

  const handleMemberChange = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleAddMember = () => {
    setMembers([...members, ""]);
  };

  const handleRemoveMember = (index) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }
    if (members.some((member) => !member.trim())) {
      setError("All member names are required.");
      return;
    }
    try {
      const groupsRef = ref(db, "groups");
      const newGroupRef = push(groupsRef);
      const groupId = newGroupRef.key;
      var memberIds = [];

      for (const member of members) {
        const usersRef = ref(db, "users");
        const newUserRef = push(usersRef);
        await set(newUserRef, {
          name: member,
        });
        memberIds.push(newUserRef.key);
      }

      await set(ref(db, "groups/" + groupId), {
        name: groupName,
        members: members,
      });

      router.push(`/group/${groupId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create the group. Try again later.");
    }
  };

  return (
    <Layout>
      <div className="container">
        <div style={{ paddingTop: "20px" }}>
          <Card>
            <div style={{ padding: "10%" }}>
              <h1>Splitting the Bill Should be Easy.</h1>
              <h3>Build Your Group. Share Your Link. Settle Up.</h3>
              <br />
              <br />
              <h3>First, Build Your Group</h3>
              What is your group name?
              <br />
              <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <br />
              <br />
              Who is in your group?
              <br />
              {members.map((member, index) => (
                <div key={index}>
                  <input
                    type="text"
                    placeholder={`Member ${index + 1}`}
                    value={member}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                  />
                  <button onClick={() => handleRemoveMember(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button onClick={handleAddMember}> + New Member</button>
              <br />
              <br />
              <button onClick={handleCreateGroup}>Submit</button>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <br />
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
