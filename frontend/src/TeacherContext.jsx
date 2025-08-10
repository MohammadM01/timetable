import React, { createContext, useState, useEffect } from 'react';

export const TeacherContext = createContext();

export const TeacherProvider = ({ children }) => {
  const [teachers, setTeachers] = useState([]);

  // Fetch teachers from backend when component mounts
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/teachers');
      if (!response.ok) throw new Error('Failed to fetch teachers');
      const data = await response.json();
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const addTeachers = async (newTeachers) => {
    try {
      // If it's a single teacher, use the single endpoint
      if (newTeachers.length === 1) {
        const response = await fetch('http://localhost:5000/api/teachers/single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newTeachers[0]),
        });
        
        if (!response.ok) throw new Error('Failed to add teacher');
      } else {
        // For multiple teachers, use the bulk endpoint
        const response = await fetch('http://localhost:5000/api/teachers/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newTeachers),
        });
        
        if (!response.ok) throw new Error('Failed to save teachers');
      }
      
      // Fetch updated teachers list from backend
      await fetchTeachers();
    } catch (error) {
      console.error('Error saving teachers:', error);
      throw error;
    }
  };

  const addPrincipal = async (principal) => {
    try {
      const response = await fetch('http://localhost:5000/api/teachers/principal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(principal),
      });
      
      if (!response.ok) throw new Error('Failed to save principal');
      
      // Fetch updated teachers list from backend
      await fetchTeachers();
    } catch (error) {
      console.error('Error saving principal:', error);
      throw error;
    }
  };

  return (
    <TeacherContext.Provider value={{ teachers, addTeachers, addPrincipal }}>
      {children}
    </TeacherContext.Provider>
  );
};