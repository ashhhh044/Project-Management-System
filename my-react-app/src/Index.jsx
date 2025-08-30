import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import NavBar from "./NavBar";
import ViewProjects from "./ViewProjects";

function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <NavBar />
      <ViewProjects user={user} />
      {/* <Footer /> */}
    </div>
  );
}

export default Index;
