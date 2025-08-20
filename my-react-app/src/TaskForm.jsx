import './styles.css'
import './TaskForm.css';
import plusCircle from './assets/plus-circle-dotted.svg';
import AddTaskCard from './AddTaskCard';
import { Link } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';


function TaskForm(){
    return(
        <>
        <NavBar />
        <div id="add-task" className="add-task">
        <Link to="/add-task-form">
                <img src={plusCircle} alt="add-task-button"/>
        </Link>            
        <p>No Tasks In this Project<br/>Click + To Add</p>
        </div>
        <Footer />
        </>
    )
}

export default TaskForm;