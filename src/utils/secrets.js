import {
    SecretsManagerClient,
    GetSecretValueCommand,
  } from "@aws-sdk/client-secrets-manager";
  import { fromIni } from "@aws-sdk/credential-provider-ini";
  
  const secretName = "kuvauspalvelut";
  const region = "eu-north-1";
  
  const secretsManagerClient = new SecretsManagerClient({
    region,
    credentials: fromIni({ profile: "default" }),
  });
  
  let cachedSecrets;
  
  export async function getSecrets() {
    if (cachedSecrets) return cachedSecrets;
  
    try {
      const response = await secretsManagerClient.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );
  
      if ("SecretString" in response) {
        cachedSecrets = JSON.parse(response.SecretString);
        return cachedSecrets;
      } else {
        throw new Error("SecretBinary is not supported.");
      }
    } catch (error) {
      console.error("Error fetching secrets from Secrets Manager:", error);
      throw error;
    }
  }
  