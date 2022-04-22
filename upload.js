const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
require('dotenv').config()

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw Error("Azure Storage Connection string not found");
}

async function main() {
  console.log("Azure Blob storage v12 - JavaScript quickstart sample");

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );

  const containerName = "quickstart" + uuidv1();

  console.log("\nCreating container...");
  console.log("\t", containerName);

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const createContainerResponse = await containerClient.create();
  console.log(
    "Container was created successfully. requestId: ",
    createContainerResponse.requestId
  );

  const blobName = "quickstart" + uuidv1() + ".txt";

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  console.log("\nUploading to Azure storage as blob:\n\t", blobName);

  const data = "Hello, World!";
  const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
  console.log(
    "Blob was uploaded successfully. requestId: ",
    uploadBlobResponse.requestId
  );

  console.log("\nListing blobs...");

  for await (const blob of containerClient.listBlobsFlat()) {
    console.log("\t", blob.name);
  }

  const downloadBlockBlobResponse = await blockBlobClient.download(0);
  console.log("\nDownloaded blob content...");
  console.log(
    "\t",
    await streamToText(downloadBlockBlobResponse.readableStreamBody)
  );
  console.log("\nDeleting container...");

//   const deleteContainerResponse = await containerClient.delete();
//   console.log(
//     "Container was deleted successfully. requestId: ",
//     deleteContainerResponse.requestId
//   );
}

async function streamToText(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}

main()
  .then(() => console.log("Done"))
  .catch((ex) => console.log(ex.message));