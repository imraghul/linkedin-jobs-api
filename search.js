const linkedIn = require('linkedin-jobs-api');

const queryOptions = {
  keyword: 'Product Manager',
  location: 'India',
  dateSincePosted: 'past Week',
  jobType: 'full time',
  remoteFilter: 'remote',
  salary: '',
  experienceLevel: 'Experienced',
  limit: '10',
};

linkedIn.query(queryOptions).then(jobs => {
  console.log(jobs);
});