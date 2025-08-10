const API_BASE_URL = 'http://localhost:5000/api';

export const login = async (username, password) => {
  console.log('Logging in:', { username, password });
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    return data;
  } catch (err) {
    console.warn('Login API unavailable. Proceeding with demo login (frontend-only).', err?.message || err);
    return { success: true, user: { username } };
  }
};

export const savePrincipal = async (principal) => {
  console.log('Saving principal:', principal);
  
  // Ensure numeric values
  const formattedPrincipal = {
    name: principal.name,
    weeklyPeriods: Number(principal.weeklyPeriods),
    dailyPeriods: Number(principal.dailyPeriods)
  };

  const response = await fetch(`${API_BASE_URL}/teachers/principal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formattedPrincipal)
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to save principal');
  }
  return data;
};

export const deletePrincipal = async () => {
  console.log('Deleting principal');
  const response = await fetch(`${API_BASE_URL}/teachers/principal/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to delete principal');
};

export const saveTeachers = async (teachers) => {
  console.log('Saving teachers:', teachers);
  const response = await fetch(`${API_BASE_URL}/teachers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teachers)
  });
  if (!response.ok) throw new Error('Failed to save teachers');
};

export const getTeachers = async () => {
  const response = await fetch(`${API_BASE_URL}/teachers`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch teachers');
  return data;
};

export const saveClasses = async (classes) => {
  console.log('Saving classes:', classes);
  const response = await fetch(`${API_BASE_URL}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(classes)
  });
  if (!response.ok) throw new Error('Failed to save classes');
  return response.json();
};

export const deleteClass = async (classId) => {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to delete class');
  return response.json();
};

export const updateClass = async (classId, classData) => {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(classData)
  });
  if (!response.ok) throw new Error('Failed to update class');
  return response.json();
};

export const getClasses = async () => {
  const response = await fetch(`${API_BASE_URL}/classes`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch classes');
  return data;
};

export const saveSubjects = async (subjects) => {
  console.log('Saving subjects:', subjects);
  const response = await fetch(`${API_BASE_URL}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subjects)
  });
  if (!response.ok) throw new Error('Failed to save subjects');
};

export const getSubjects = async () => {
  const response = await fetch(`${API_BASE_URL}/subjects`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch subjects');
  return data;
};

export const savePeriods = async (periods) => {
  console.log('Saving periods:', periods);
  const response = await fetch(`${API_BASE_URL}/periods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(periods)
  });
  if (!response.ok) throw new Error('Failed to save periods');
};

export const generateTimetable = async () => {
  console.log('Generating timetable...');
  const response = await fetch(`${API_BASE_URL}/timetable/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) throw new Error('Failed to generate timetable');
};

export const getTimetable = async () => {
  const response = await fetch(`${API_BASE_URL}/timetable`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch timetable');
  return data;
};

export const uploadClasses = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/classes/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload classes');
  }

  return response.json();
};

export const fetchSubjects = async () => {
  const response = await fetch(`${API_BASE_URL}/subjects`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch subjects');
  }
  return response.json();
};

export const deleteSubject = async (id) => {
  const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete subject');
  }
  return response.json();
};

export const updateSubject = async (id, subjectData) => {
  const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subjectData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update subject');
  }
  return response.json();
};

export const fetchTeachers = async () => {
  const response = await fetch(`${API_BASE_URL}/teachers`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch teachers');
  }
  return response.json();
};

export const deleteTeacher = async (id) => {
  const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete teacher');
  }
  return response.json();
};

export const updateTeacher = async (id, teacherData) => {
  const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(teacherData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update teacher');
  }
  return response.json();
};

export const uploadTeachers = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/teachers/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload teachers');
  }

  return response.json();
};

export const updatePrincipalPeriods = async (periodsData) => {
  const response = await fetch(`${API_BASE_URL}/teachers/principal/update-periods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(periodsData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update principal periods');
  }

  return response.json();
};