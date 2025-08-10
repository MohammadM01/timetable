import React, { createContext, useState, useEffect } from 'react';

export const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [principal, setPrincipal] = useState(null);

  // Fetch all data when component mounts
  useEffect(() => {
    fetchTeachers();
    fetchClasses();
    fetchSubjects();
    fetchPrincipal();
  }, []);

  const fetchPrincipal = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/principals');
      if (!response.ok) throw new Error('Failed to fetch principal');
      const data = await response.json();
      if (data.length > 0) {
        setPrincipal(data[0]);
      }
    } catch (error) {
      console.error('Error fetching principal:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      // Fetch teachers
      const response = await fetch('http://localhost:5000/api/teachers');
      if (!response.ok) throw new Error('Failed to fetch teachers');
      const data = await response.json();
      
      // Fetch principal
      const principalResponse = await fetch('http://localhost:5000/api/principals');
      const principalData = await principalResponse.json();
      
      // Start with regular teachers, ensure IDs are numbers
      let allTeachers = data
        .filter(teacher => teacher && teacher.id) // Filter out any invalid teacher data
        .map(teacher => ({
          ...teacher,
          id: parseInt(teacher.id),
          isPrincipal: false
        }));

      // Add principal if exists
      if (principalData.length > 0) {
        const principalTeacher = {
          ...principalData[0],
          id: parseInt(principalData[0].id), // Parse the ID from the database
          isPrincipal: true,
          weeklyPeriods: principalData[0].weekly_periods,
          dailyPeriods: principalData[0].daily_max_periods
        };
        // Only add principal if they're not already in the teachers list
        const principalExists = allTeachers.some(
          teacher => teacher.name.toLowerCase() === principalData[0].name.toLowerCase()
        );
        if (!principalExists) {
          allTeachers = [principalTeacher, ...allTeachers];
        }
      }

      // Sort teachers by name (principal will stay at the top since we added them first)
      allTeachers.sort((a, b) => {
        if (a.isPrincipal) return -1;
        if (b.isPrincipal) return 1;
        return a.name.localeCompare(b.name);
      });

      // Log the final teachers data for debugging
      console.log('Final teachers data:', allTeachers.map(t => ({
        id: t.id,
        name: t.name,
        isPrincipal: t.isPrincipal,
        type: typeof t.id
      })));

      setTeachers(allTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]); // Set empty array on error
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/classes');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch classes');
      }
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/subjects');
      if (!response.ok) throw new Error('Failed to fetch subjects');
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const addTeachers = async (newTeachers) => {
    try {
      // Filter out empty entries and format data
      const formattedTeachers = newTeachers
        .filter(t => t.name)
        .map(t => ({
          name: t.name.trim(),
          weeklyPeriods: Number(t.weeklyPeriods),
          dailyPeriods: Number(t.dailyPeriods)
        }));

      console.log('Saving teachers:', formattedTeachers);
      
      const response = await fetch('http://localhost:5000/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedTeachers),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save teachers');
      }

      console.log('Teachers saved successfully:', data);
      await fetchTeachers();
    } catch (error) {
      console.error('Error saving teachers:', error);
      throw error;
    }
  };

  const addPrincipal = async (principalData) => {
    try {
      const response = await fetch('http://localhost:5000/api/principals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(principalData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save principal');
      }

      await fetchTeachers(); // This will also fetch and update the principal
    } catch (error) {
      console.error('Error saving principal:', error);
      throw error;
    }
  };

  const addClasses = async (newClasses) => {
    try {
      // Filter out empty entries and format data
      const formattedClasses = Array.isArray(newClasses) ? newClasses : [newClasses];
      
      // Update the state immediately for optimistic UI update
      setClasses(prevClasses => {
        const updatedClasses = [...prevClasses];
        formattedClasses.forEach(newClass => {
          const index = updatedClasses.findIndex(c => c.id === newClass.id);
          if (index !== -1) {
            updatedClasses[index] = newClass;
          } else {
            updatedClasses.push(newClass);
          }
        });
        return updatedClasses;
      });

    } catch (error) {
      console.error('Error updating classes:', error);
      // Revert to original state on error
      await fetchClasses();
      throw error;
    }
  };

  const addSubjects = async (newSubjects) => {
    try {
      const response = await fetch('http://localhost:5000/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSubjects),
      });
      
      if (!response.ok) throw new Error('Failed to save subjects');
      await fetchSubjects();
    } catch (error) {
      console.error('Error saving subjects:', error);
    }
  };

  return (
    <SchoolContext.Provider value={{
      teachers,
      classes,
      subjects,
      principal,
      addTeachers,
      addPrincipal,
      addClasses,
      addSubjects,
      fetchTeachers,
      fetchClasses,
      fetchSubjects,
      fetchPrincipal
    }}>
      {children}
    </SchoolContext.Provider>
  );
};