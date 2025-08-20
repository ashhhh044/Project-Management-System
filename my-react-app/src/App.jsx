import { useState } from 'react'
import TaskForm from './TaskForm'
import Login from './Login'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Index from './Index'
import AddProject from './AddProject'
import AddTaskCard from './AddTaskCard'
import AddProjectCard from './AddProjectCard'
import ViewTasks from './ViewTasks'
import ViewProjects from './ViewProjects'
import Signin from './Signin'
import Members from './Members'
import ViewMembers from './ViewMembers'
import EditMember from './EditMember'
import EditTask from './EditTask'
import ResourcePage from './ResourcePage'

function App() {
 
  return (
    <>
      <Router> 
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/add-project" element={<AddProject />} />
          <Route path="/add-project-form" element={<AddProjectCard />} />
          <Route path="/task-form" element={<TaskForm />} />
          <Route path="/add-task-form" element={<AddTaskCard />} />
          <Route path="/view-tasks" element={<ViewTasks />} />
          <Route path="/edit-task/:id" element={<EditTask />} />  
          <Route path="/view-projects" element={<ViewProjects />} />
          <Route path="/add-member" element={<Members />} />
          <Route path="/view-members" element={<ViewMembers />} />
          <Route path="/edit-member/:id" element={<EditMember />} />  
          <Route path="/projects/:id/resources" element={<ResourcePage />} />
        </Routes>
      </Router>
      </>
    
  )
}


export default App
