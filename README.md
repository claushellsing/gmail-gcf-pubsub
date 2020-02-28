# gmail-gcf-pubsub
Demo of Google Cloud Functions, PubSub and Gmail API

**Based on Codelab
https://codelabs.developers.google.com/codelabs/intelligent-gmail-processing/index.html**

This demo use Gmail api to publish a messages in Google Cloud Pub/Sub service, into a topic that will trigger a custom Google Cloud Function

### 1. Publish auth_init Google Cloud Function

This function is the inital auth step for OAuth2 flow

From `/auth` folder execute the following command from within the google cloud shell

>gcloud beta functions deploy auth_init --runtime=nodejs8 --trigger-http --env-vars-file=env_vars.yaml --project <PROJECT_ID>

### 2. Publish auth_call Google Cloud Function

This function is the initialize the Google API watch function

From `/auth` folder execute the following command from within the google cloud shell

>gcloud beta functions deploy auth_callback --runtime=nodejs8 --trigger-http --env-vars-file=env_vars.yaml --project <PROJECT_ID>

### 3. Publish watchGmailMessages Google Cloud Function

Finally thhe function the will be executed everytime a new mail arrive

From `/pubsub` folder execute the following command from within the google cloud shell

>gcloud beta functions deploy watchGmailMessages --runtime=nodejs8 --trigger-topic=<TOPIC> --env-vars-file=env_vars.yaml --project <PROJECT_ID>
