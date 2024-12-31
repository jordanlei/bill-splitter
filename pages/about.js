import React from "react";
import Layout from "../components/layout";
import Card from "../components/card";

const About = () => {
  return (
    <Layout>
      <div className="container">
        <Card>
          <h1>About Split</h1>
          <p>
            Welcome to Split! Split is a simple and easy-to-use bill splitting
            application that helps you divide expenses among friends and family.
            Whether you're dining out, traveling, or sharing household expenses,
            Split makes it easy to keep track of who owes what.
          </p>
          <div>
            <h3>How to Use</h3>
            <div>
              <ol>
                <li>
                  <strong>Create a Group.</strong> Start by creating a group.
                  Give your group a name and add the names of all its members
                </li>
                <li>
                  <strong>Share the Link.</strong> Once you create a group,
                  share the unique link with all the members.
                </li>
                <li>
                  <strong>Add Expenses and Payments.</strong> You and other
                  group members can add all the expenses and payments made by
                  the group members. The expenses can be broken down into
                  individual items (e.g. Dinner can be split into individual
                  orders). Split will automatically calculate how much each
                  member owes.
                </li>
              </ol>

              <p>
                That's it! Split takes care of the calculations, so you can
                focus on enjoying your time.
              </p>
            </div>
            <div>
              <video width="100%" controls>
                <source src="/tutorial.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <br/><br/>

          <h3>Features</h3>
          <ul>
            <li>
              Unique group link: Each group gets a unique link that can be
              shared with all members for easy access.
            </li>
            <li>
              Editable items: You can edit or delete any item or expense at any
              time to keep the records accurate.
            </li>
            <li>
              Option to split remainder evenly or proportionally: Choose to
              split the remainder of any bill evenly among all members or
              proportionally based on their shares.
            </li>
            <li>
              Always free: Our service is completely free to use, with no hidden
              charges or fees.
            </li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};

export default About;
