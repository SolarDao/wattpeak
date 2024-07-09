// components/Projects.js
import React, { useEffect, useState } from 'react';
import { queryProjects } from '../../utils/queryProjects'; // Adjust the import path as needed

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await queryProjects();
        setProjects(result);
        console.log('Projects:', result);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Projects</h1>
      <ul>
        {projects.map((project, index) => (
          <li key={index}>
            <p>Project ID: {project.index}</p>
            <p>Project Name: {project.name}</p>
            <p>Project Description: {project.description}</p>
            {/* Render other project details as needed */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Projects;
