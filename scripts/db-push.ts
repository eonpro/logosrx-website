import { config } from "dotenv";
config({ path: ".env.local" });

import { execSync } from "child_process";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { Signer } from "@aws-sdk/rds-signer";

async function main() {
  const signer = new Signer({
    hostname: process.env.PGHOST!,
    port: Number(process.env.PGPORT),
    username: process.env.PGUSER!,
    region: process.env.AWS_REGION!,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION! },
    }),
  });

  console.log("Generating IAM auth token...");
  const token = await signer.getAuthToken();

  const url = `postgresql://${process.env.PGUSER}:${encodeURIComponent(token)}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;

  console.log("Running drizzle-kit push...");
  execSync("npx drizzle-kit push", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: url,
    },
  });
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
