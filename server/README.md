### Setting up the environment for development

1. get necessary env variables
2. create postgres db with docker locally https://www.youtube.com/watch?v=TfJ8YD7sfsI
3. `cd server`
4. `npm run db:migrate`
5. `npm run populateBase`

This is the basic setup to get the environment ready

---

If we want to test the instagram posts fetching and processing, we will need an instagram account with an instagram access token. This account needs to be have a `Instagram Tester` role in our instagram app (meta developer dashboard).

Once we have that, we will need to:

- run the backend server
- run the frontend
- do the `Authorize With Instagram` flow with the tester account
- backend server should handle the fetching and upgrading the token
- once we have the access token, we can fetch posts from the account
