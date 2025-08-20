import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AddProject from "./AddProject";
import Footer from "./Footer";
import NavBar from "./NavBar";
import ViewProjects from "./ViewProjects";

function Index() {
  const navigate = useNavigate();

  // Check if user is logged in (token exists)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login page if not logged in
      navigate("/login");
    }
  }, [navigate]);

  // Handler to force login if user clicks anywhere and no token
  const handleUserAction = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  };

  return (
    <div onClick={handleUserAction}>
      <NavBar />
      <ViewProjects />
      <Footer />
    </div>
  );
}

export default Index;
