const Auth = require("@google-cloud/express-oauth2-handlers");
const { google } = require("googleapis");
const gmail = google.gmail("v1");

const requiredScopes = [
  "profile",
  "email",
  "https://www.googleapis.com/auth/gmail.modify"
];

const auth = Auth("datastore", requiredScopes, "email", true);

const GCP_PROJECT = process.env.GCP_PROJECT;
const PUBSUB_TOPIC = process.env.PUBSUB_TOPIC;

const setUpGmailPushNotifications = (email, pubsubTopic) => {
  return gmail.users.watch({
    userId: email,
    requestBody: {
      labelIds: ["INBOX"],
      topicName: `projects/${GCP_PROJECT}/topics/${pubsubTopic}`
    }
  });
};

const onSuccess = async (req, res) => {
  let email;

  try {
    email = await auth.auth.authedUser.getUserId(req, res);
    const OAuth2Client = await auth.auth.authedUser.getClient(req, res, email);
    google.options({ auth: OAuth2Client });
  } catch (err) {
    console.log(err);
    throw err;
  }

  try {
    await setUpGmailPushNotifications(email, PUBSUB_TOPIC);
  } catch (err) {
    if (
      !err
        .toString()
        .includes("one user push notification client allowed per developer")
    ) {
      throw err;
    }
  }

  res.send(`Successfully set up Gmail push notifications.`);
};

const onFailure = (err, req, res) => {
  res.send(`An error has occurred in the authorization process.`);
};

exports.auth_init = auth.routes.init;
exports.auth_callback = auth.routes.cb(onSuccess, onFailure);
