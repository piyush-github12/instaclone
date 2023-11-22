
const nodemailer = require("nodemailer");
const googleapis = require("googleapis");

const CLIENT_ID = `229140260601-pghfnnbviedknm2rh219k1di0bvro1us.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//04IK_WVLmhmHCCgYIARAAGAQSNwF-L9IrHy5P0WRTqXbsSJs3klZzmk2CT7yAmhGQcfUidOOml_HSfaUidNmAe6H8SpqJP-L7BAU`;
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;

const oauthClient = new googleapis.google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauthClient.setCredentials({ refresh_token: REFRESH_TOKEN });

async function mailer(receiver, userid, key) {
  try {
    const ACCESS_TOKEN = await oauthClient.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "gayakwadpiyush02@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: ACCESS_TOKEN,
      },
    });

    const details = {
      from: "Piyush Gayakwad<gayakwadpiyush02@gmail.com>",
      to: receiver,
      subject: "kuch bhi",
      text: "kuch bhi",
      html: `<h2>click this link for reset your password <a href="http://localhost:3000/forgot/${userid}/${key}">  </a> http://localhost:3000/forgot/${userid}/${key} </h2>`,
    };
    const result = await transport.sendMail(details);
    return result;
  } catch (err) {
    return err;
  }
}

module.exports = mailer;
