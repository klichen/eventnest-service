import { syncSOPClubs } from './service';

(async () => {
  await syncSOPClubs(true); // insert 10 clubs for local db
})();
