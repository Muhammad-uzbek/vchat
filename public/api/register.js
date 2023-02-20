import express from 'express';
const router = express.Router();
const smsUrl = "http://81.95.228.2:8080/sms_send.php";
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import bodyParser from 'body-parser';
import axios from 'axios';

// const Low = require('lowdb')
// const JSONFile = require('lowdb/adapters/JSONFile')
// const { join } = require('node:path')
// const { fileURLToPath } = require('node:url')

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const file = join('data', 'logins.json');
const adapter = new JSONFile(file)
const db = new Low(adapter)

async function getStatusOfUser(number, ip){
        let statusUser =  await axios.get(smsUrl, {params:{action:'status', msisdn:number }}).then((res) => res.data);
        if(statusUser){
            // find user in db and update ip
            await db.read();
            let user = db.data.login.find((item) => item.msisdn == number);
            if(user){
                if(user.ip.includes(ip)){
                    return "already";
                }else{
                    return "ask for pass";
                }
            }else{
                // add user to db
                await db.data.login.push({msisdn: number, ip: [ip]});
                await db.write();
            }
        }else{
            return 0;
        }
}
async function sendSMS(number, code){
    let data = {
        "msisdn": number,
        "action": "sms",
        "body":  code
    };
    let sendSMS = await axios.get(smsUrl, {params: data});
    let sms = sendSMS.data;
    return sms;
}




router.get("/register", async (req, res) => {
    console.log(req.body);
    res.send("ok");
});

router.post("/register", async (req, res) => {
    // given a phone number, and get ip address
    // check if phone number is in db
    // if not send sms with code
    // if yes, return "already registered"
    // parse body if it is json
    let bodyReq = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    let logStatus = await getStatusOfUser(bodyReq.msisdn, bodyReq.ip);
    if(logStatus === "already"){
        res.send({msg: "already registered", code: 0});
    }else {
        let code = Math.floor(1000 + Math.random() * 9000);
        let sms = await sendSMS(bodyReq.msisdn, code);
        res.send({msg: "sms", code: code});
    }

    // await db.read();
    // let login = db.data.login.find((item) => item.msisdn === req.body.msisdn) || null;
    // console.log(login);
    // if (login === null) {
    //     let sendSMS = await axios.post(smsUrl, data);
    //     let sms = sendSMS.data;
    //     console.log(sms);
    //     res.send({sms: sms, code: code});
    // } else {
    //     res.send({sms: "already registered", code: code});
    // }
});

export default router;