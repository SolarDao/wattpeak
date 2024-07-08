import React, { useEffect, useState } from 'react';
import { queryStakers } from '../../utils/queryStaker'; // Adjust the import path if necessary

export const Home = () => {
  const [stakers, setStakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStakers = async () => {
      try {
        const result = await queryStakers();
        setStakers(result.stakers);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchStakers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Home Page</h1>
      <h2>Stakers Info</h2>
      <ul>
        {stakers.map((staker, index) => (
          <li key={index}>
            <p>Address: {staker}</p>
            <p>Staked Amount: {staker}</p>
            <p>Interest Earned: {staker}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
