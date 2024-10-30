module.exports = {
  dsa: {
    host: {
      doc: 'DSA Host',
      format: String,
      default: 'http://localhost:8080',
      env: 'DSA_HOST',
    },
    authToken: {
      doc: 'DSA Authorization Token',
      format: String,
      default: '',
      env: 'DSA_AUTH_TOKEN',
    },
    username: {
      doc: 'DSA Admin Username',
      format: String,
      default: '',
      env: 'DSA_USERNAME',
    },
    password: {
      doc: 'DSA Admin Password',
      format: String,
      default: '',
      env: 'DSA_PASSWORD',
    },
    baseCollection: {
      doc: 'DSA Base Collection',
      format: String,
      default: '',
      env: 'DSA_BASE_COLLECTION_ID',
    },
    folderName: {
      doc: 'DSA Folder Name',
      format: String,
      default: 'lcdr',
      env: 'DSA_FOLDER_NAME',
    },
  },

  swagger: {
    apiUser: {
      doc: 'Swagger API-DOCS authentication username',
      format: String,
      default: 'moffitt-swagger',
      env: 'SWAGGER_API_USERNAME',
    },
    apiPassword: {
      doc: 'Swagger API-PASSWORD authentication',
      format: String,
      default: 'moffitt',
      env: 'SWAGGER_API_PASSWORD',
    },
  },
};
