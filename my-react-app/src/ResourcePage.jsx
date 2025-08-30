import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

function ResourcePage() {
  const { id } = useParams();
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/projects/${id}/resources`, {
      credentials: "include" 
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Resources fetched:", data);
        setResources(data);
      })
      .catch((err) => console.error("Error fetching resources:", err));
  }, [id]);

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 700, margin: "20px auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#1d3557" }}>
          Resources for Project {id}
        </h2>

        {resources.length > 0 ? (
          resources.map((r, idx) => (
            <div key={idx} className="view-task" style={{ marginBottom: "10px" }}>
              <div className="task-details">
                <div className="task-pri-details">
                  <label className="task-name">
                    {r.split("/").pop()} {/* show file name */}
                  </label>
                </div>
                <div className="task-sec-details">
                  <div className="deadline-badge">
                    <a
                      href={`http://localhost:5000${r}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="view-task" style={{ textAlign: "center", padding: "20px" }}>
            <p>No resources uploaded</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default ResourcePage;