import React, { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Import the carousel styles
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
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const groupProjects = (projects, itemsPerGroup) => {
    const groupedProjects = [];
    for (let i = 0; i < projects.length; i += itemsPerGroup) {
      groupedProjects.push(projects.slice(i, i + itemsPerGroup));
    }
    return groupedProjects;
  };

  const groupedProjects = groupProjects(projects, 3);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Projects</h1>
      <Carousel showThumbs={false} infiniteLoop useKeyboardArrows>
        {groupedProjects.map((group, index) => (
          <div key={index} className="project-group">
            {group.map((project) => (
              <div key={project.index} className="project-card">
                <img src="../../images/panel.png" alt={`Project ${project.index}`} />
                <div className="project-details">
                  <p>Project ID: {project.index}</p>
                  <p>Project Name: {project.name}</p>
                  <p>Project Description: {project.description}</p>
                  <p>Max WattPeak: {project.max_wattpeak / 1000000}</p>
                  <p>Minted Wattpeak: {project.minted_wattpeak_count / 1000000}</p>
                  <button>Select</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default Projects;
