// Re-export API from shared package
export {
  generateQuestion,
  evaluateAnswer,
  getLlmProviders,
  register,
  login,
  getCurrentUser,
  getSessions,
  getSession,
  saveSession,
  getStatistics,
  default as api
} from '@learning-coach/shared/api';
