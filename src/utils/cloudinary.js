import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOncloudinary = async function (localPathURL) {
  try {
    console.log("here", localPathURL);
    const upload = await cloudinary.uploader.upload(localPathURL, {
      resource_type: "auto",
    });
    console.log(upload);
    console.log("file uploaded to cloudinary successfully");
    fs.unlinkSync(localPathURL);
    return upload;
  } catch (error) {
    console.log("error in uploading file to cloudinary: ", error);
    if (!localPathURL) {
      fs.unlinkSync(localPathURL);
    }
  }
};

const deleteFileFromCloudinary = async (localPathURL) => {
  let public_id = localPathURL.replace(
    "http://res.cloudinary.com/dgrm75hbj/image/upload/",
    ""
  );
  public_id = public_id.replace(".png", "");
  const array = public_id.split("/");
  public_id = array[0];
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    console.log(result);
    console.log(`file deleted from cloudinary successfully!!!`);
    return result;
  } catch (error) {
    console.log("error in deleting file from cloudinary", error);
  }
};

export { uploadOncloudinary , deleteFileFromCloudinary };
