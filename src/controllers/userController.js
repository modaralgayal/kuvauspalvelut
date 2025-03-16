import jwt, { decode } from "jsonwebtoken";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminUpdateUserAttributesCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";
import { getSecrets } from "../utils/secrets.js";
// create and import getSecrets here <--

let cognitoClient;

async function initCognitoClient() {
  if (!cognitoClient) {
    const secrets = await getSecrets();
    cognitoClient = new CognitoIdentityProviderClient({
      region: secrets.AWS_DEFAULT_REGION,
    });
  }
}

const generateSecretHash = (username, clientId, clientSecret) => {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
};

export const signup = async (req, res) => {
  console.log("Signing up");
  try {
    const { username, password, email, phoneNumber } = req.body;

    await initCognitoClient();
    const secrets = await getSecrets();

    const secretHash = generateSecretHash(
      username,
      secrets.AWS_CLIENT_ID,
      secrets.AWS_CLIENT_SECRET
    );

    const params = {
      ClientId: secrets.AWS_CLIENT_ID,
      SecretHash: secretHash,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "phone_number",
          Value: phoneNumber,
        },
      ],
    };

    const command = new SignUpCommand(params);
    const data = await cognitoClient.send(command);

    res.json(data);
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(400).json({ error: error.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    await initCognitoClient();
    const secrets = await getSecrets();

    const secretHash = generateSecretHash(
      username,
      secrets.AWS_CLIENT_ID,
      secrets.AWS_CLIENT_SECRET
    );

    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: secrets.AWS_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    };

    const command = new InitiateAuthCommand(params);
    const data = await cognitoClient.send(command);

    const idToken = data.AuthenticationResult.IdToken;

    // Decode the ID token to extract user attributes
    const decodedIdToken = decode(idToken);
    if (!decodedIdToken || !decodedIdToken.sub) {
      throw new Error("Invalid ID token.");
    }

    // Continue with JWT signing or response setup
    const userSub = decodedIdToken.sub;
    const jwtToken = jwt.sign(
      { sub: userSub, clientId: secrets.AWS_CLIENT_ID, username },
      secrets.MY_SECRET_JWT_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("token", jwtToken, {
      secure: true,
      httpOnly: true,
      path: "/",
      sameSite: "None",
      domain: "kuvauspalvelut.fi",
    });

    res.cookie("usertype", userType, {
      secure: true,
      httpOnly: true,
      path: "/",
      sameSite: "None",
      domain: "kuvauspalvelut.fi",
    });

    res.json({
      success: true,
      message: "Sign in successful!",
      redirectUrl: "https://kuvauspalvelut.fi/",
      accessToken: data.AuthenticationResult.AccessToken,
      idToken,
      refreshToken: data.AuthenticationResult.RefreshToken,
    });
  } catch (error) {
    console.error("Error in signIn:", error);
    res.status(400).json({ error: error.message });
  }
};

export const logOut = (req, res) => {
  console.log("Logging out");
  try {
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: "kuvauspalvelut.fi",
    });

    res.cookie("usertype", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: "kuvauspalvelut.fi",
    });

    res.redirect("https://kuvauspalvelut.fi");
  } catch (error) {
    console.log("There was an error in logging out: ", error.message);
    console.error("Error in logOut:", error);
    res.status(400).json({ error: error.message });
  }
};

export const confirmSignup = async (req, res) => {
  try {
    const { username, confirmationCode } = req.body;

    await initCognitoClient();
    const secrets = await getSecrets();

    const secretHash = generateSecretHash(
      username,
      secrets.AWS_CLIENT_ID,
      secrets.AWS_CLIENT_SECRET
    );

    const params = {
      ClientId: secrets.AWS_CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode,
      SecretHash: secretHash,
    };

    const command = new ConfirmSignUpCommand(params);
    const data = await cognitoClient.send(command);

    res.json({ message: "User confirmed successfully!", data });
  } catch (error) {
    console.error("Error in confirmSignup:", error);
    res.status(400).json({ error: error.message });
  }
};
