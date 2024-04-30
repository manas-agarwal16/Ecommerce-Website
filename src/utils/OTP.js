import nodemailer from "nodemailer";

const generateOTP = () => {
  let otp = "";
  let array = [];
  for (let i = 0; i < 4; i++) {
    const num = Math.floor(Math.random() * 10);
    otp += num;
  }
  otp = Number(otp);
  return otp;
};

//nodemailer config.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

const sendOTPThroughEmail = async (userEmail, OTP) => {
  console.log(userEmail);
  let mailOptions = {
    from: "manas.agarwal1604@gmail.com",
    to: userEmail,
    subject: "OTP verification",
    text: `Your OTP for email verification : ${OTP}`,
  };

  let statusOfMail;
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error occurred:", error);
      if (error.code === "EENVELOPE") {
        console.log("email address is invalid or does not exists");
      }
      statusOfMail = false;
    } else {
      console.log("Email sent:", info.response);
      statusOfMail = true;
    }
  });
  return statusOfMail;
};

export { generateOTP, sendOTPThroughEmail };
