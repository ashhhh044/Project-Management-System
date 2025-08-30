import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

function ViewProjectMembers({ user }) {
  const { id } = useParams(); // projectId
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMembers = async () => {
      try {
        const res = await fetch(`http://localhost:5000/projects/${id}/members`);
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();

        const sanitizedData = data.map((m) => ({
          id: m.id,
          member_name: m.member_name || "Unnamed",
          title: m.title || "",
          designation: m.designation || "",
        }));

        setMembers(sanitizedData);
      } catch (err) {
        console.error("[DEBUG] Error fetching members:", err);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [id, user]);

  if (!user) return <p>Loading user info...</p>;
  if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading members...</p>;

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 700, margin: "20px auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Project Members</h2>
        {members.length === 0 ? (
          <p style={{ textAlign: "center" }}>No members found for this project.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {members.map((m) => (
              <li
                key={m.id}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  border: "1px solid #A8DADC",
                  borderRadius: "0.75rem",
                  background: "#f8f9fa",
                }}
              >
                <strong>{m.title ? `${m.title} ` : ""}{m.member_name}</strong>
                {m.designation ? ` – ${m.designation}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer />
    </>
  );
}

export default ViewProjectMembers;
