import axios from 'axios';

const API = axios.create({ baseURL: 'https://project-1-backend-ejbo.onrender.com/api' });

API.interceptors.request.use(req => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = 'Bearer ' + token;
  return req;
});

export const register = (d) => API.post('/auth/register', d);
export const login    = (d) => API.post('/auth/login', d);
export const getMe    = ()  => API.get('/auth/me');

export const postProblem       = (d)     => API.post('/problems', d);
export const getMyProblems     = ()      => API.get('/problems/my');
export const getProblem        = (id)    => API.get('/problems/' + id);
export const getAllProblems     = ()      => API.get('/problems/all');
export const getTeamProblems   = ()      => API.get('/problems/team');
export const analyseProblem    = (id)    => API.put('/problems/' + id + '/analyse');
export const assignProblem     = (id, d) => API.put('/problems/' + id + '/assign', d);
export const updateProgress    = (id, d) => API.put('/problems/' + id + '/progress', d);

export const submitApplication    = (d)      => API.post('/applications', d);
export const getMyApplications    = ()       => API.get('/applications/my');
export const getAllApplications    = ()       => API.get('/applications/all');
export const analyseApplication   = (id)     => API.put('/applications/' + id + '/analyse');
export const decideApplication    = (id, d)  => API.put('/applications/' + id + '/decide', d);

export const getTeamMembers       = ()      => API.get('/users/team-members');
export const getPendingVolunteers = ()      => API.get('/users/pending-volunteers');
export const getPendingTeam       = ()      => API.get('/users/pending-team');
export const approveTeamMember    = (id)    => API.put('/users/' + id + '/approve-team');
export const approveVolunteer     = (id)    => API.put('/users/' + id + '/approve-volunteer');
export const rejectVolunteer      = (id)    => API.put('/users/' + id + '/reject-volunteer');
export const toggleUser           = (id)    => API.put('/users/' + id + '/toggle');
export const getAllUsers           = ()      => API.get('/users');

export const getMyNGO    = ()    => API.get('/ngos/my');
export const updateMyNGO = (d)   => API.put('/ngos/my', d);
export const getAllNGOs  = ()    => API.get('/ngos/all');
export const getNGOMe    = ()    => API.get('/ngos/my');
export const createNGO   = (d)   => API.put('/ngos/my', d);
export const verifyNGO   = (id)  => API.put('/ngos/' + id + '/verify');

export const getNeeds    = ()      => API.get('/needs');
export const getNeed     = (id)    => API.get('/needs/' + id);
export const createNeed  = (d)     => API.post('/needs', d);
export const updateNeed  = (id, d) => API.put('/needs/' + id, d);
export const approveNeed = (id)    => API.put('/needs/' + id + '/approve');
export const getMyNeeds  = ()      => API.get('/needs/my');
export const getAllNeeds  = ()      => API.get('/needs/all');

export const getMatches    = ()      => API.get('/volunteers/matches');
export const updateMatch   = (id, d) => API.put('/matches/' + id, d);
export const runMatch      = (id)    => API.post('/matches/run/' + id);
export const getNeedMatches= (id)    => API.get('/matches/need/' + id);
export const acceptMatch   = (id)    => API.put('/matches/' + id + '/accept');
export const rejectMatch   = (id)    => API.put('/matches/' + id + '/reject');
export const completeMatch = (id, d) => API.put('/matches/' + id + '/complete', d);

export const getVolunteerMe    = ()  => API.get('/volunteers/my');
export const updateVolunteerMe = (d) => API.put('/volunteers/my', d);
export const updateVolunteer   = (d) => API.put('/volunteers/my', d);
export const createVolunteer   = (d) => API.put('/volunteers/my', d);

export const getAnalyticsOverview = () => API.get('/analytics/overview');
export const getNeedsByCategory   = () => API.get('/analytics/needs-by-category');
export const getMonthlyTrend      = () => API.get('/analytics/monthly-trend');
export const getTopVolunteers     = () => API.get('/analytics/top-volunteers');

export const getNotifications = () => API.get('/notifications');
export const markAllRead      = () => API.put('/notifications/read-all');
export const markOneRead      = (id) => API.put('/notifications/' + id + '/read');

export const sendNotification = (d) => API.post('/notifications/send', d);