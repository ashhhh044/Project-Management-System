import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function ResourcePage() {
  const { id } = useParams(); // project id from URL
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/projects/${id}/resources`)
      .then((res) => res.json())
      .then((data) => setResources(data))
      .catch((err) => console.error("Error fetching resources:", err));
  }, [id]);

  return (
    <div style={{ maxWidth: 700, margin: "20px auto" }}>
      <h2>Resources for Project {id}</h2>
      <ul>
        {resources.length > 0 ? (
          resources.map((r) => (
            <li key={r.id}>
              <a
                href={`http://localhost:5000/uploads/${r.resource_path}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {r.resource_path}
              </a>
            </li>
          ))
        ) : (
          <p>No resources uploaded</p>
        )}
      </ul>
    </div>
  );
}

export default ResourcePage;