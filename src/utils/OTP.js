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

const sendOTPThroughEmail = (userEmail, OTP) => {
  const transporter = nodemailer.createTransport({
    service: 'smtp.',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});

  let mailOptions = {
    from: 'manas.agarwal1604@gmail.com' ,
    to: userEmail,
    subject: "OTP verification",
    text: `Enter this OTP : ${OTP}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error occurred:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

export {generateOTP , sendOTPThroughEmail}