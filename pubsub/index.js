const Auth = require("@google-cloud/express-oauth2-handlers");
const { Datastore } = require("@google-cloud/datastore");
const axios = require("axios");
const { google } = require("googleapis");
const gmail = google.gmail("v1");

const datastoreClient = new Datastore();

const requiredScopes = [
  "profile",
  "email",
  "https://www.googleapis.com/auth/gmail.modify"
];

const auth = Auth("datastore", requiredScopes, "email", true);

const checkForDuplicateNotifications = async messageId => {
  const transaction = datastoreClient.transaction();
  await transaction.run();
  const messageKey = datastoreClient.key(["emailNotifications", messageId]);
  const [message] = await transaction.get(messageKey);
  if (!message) {
    await transaction.save({
      key: messageKey,
      data: {}
    });
  }
  await transaction.commit();
  if (!message) {
    return messageId;
  }
};

const getMostRecentMessageWithTag = async (email, historyId) => {
  const listMessagesRes = await gmail.users.messages.list({
    userId: email,
    maxResults: 1
  });
  const messageId = await checkForDuplicateNotifications(
    listMessagesRes.data.messages[0].id
  );

  if (messageId) {
    const message = await gmail.users.messages.get({
      userId: email,
      id: messageId
    });

    return message;
  }
};

/** Extract Message */
const extractInfoFromMessage = message => {
  let from;

  const headers = message.data.payload.headers;
  for (var i in headers) {
    if (headers[i].name === "From") {
      from = headers[i].value;
    }
  }

  let string = "";
  const payloadParts = message.data.payload.parts;
  for (var j in payloadParts) {
    if (payloadParts[j].body.data) {
      if (payloadParts[j].mimeType == "text/plain") {
        string += Buffer.from(payloadParts[j].body.data, "base64").toString();
      }
    }
  }

  return {
    from: from,
    body: string
  };
};

exports.watchGmailMessages = async event => {
  const data = Buffer.from(event.data, "base64").toString();
  const newMessageNotification = JSON.parse(data);
  const email = newMessageNotification.emailAddress;
  const historyId = newMessageNotification.historyId;

  try {
    await auth.auth.requireAuth(null, null, email);
  } catch (err) {
    throw err;
  }

  const authClient = await auth.auth.authedUser.getClient();
  google.options({ auth: authClient });

  const message = await getMostRecentMessageWithTag(email, historyId);
  if (message) {
    const messageInfo = extractInfoFromMessage(message);

    /** DO anything with the massage */
  }
};
