let baseUrl = "http://81.95.228.2:8080/sms_send.php";

document.getElementById("sendbtn").addEventListener("click", function(){
    var number = document.getElementById("phonenumber").value;
    sms_sender(number);
    console.log("send");
});
// work this function when user click enter
// document.getElementById("phonenumber").addEventListener("keydown", function(event){
//     if(event.key === "Enter"){
//         var number = document.getElementById("phonenumber").value;
//         sms_sender(number);
//         console.log("send");
//     }
// });


async function sms_sender(number){
    var code = Math.floor(1000 + Math.random() * 9000);
    var data = {
        "msisdn": number,
        "action": "sms",
        "body": "Your code: " + code
    };
    let ip_fetch = await fetch("https://api.ipify.org/?format=json");
    let ip_user = await ip_fetch.json().then((data) => data.ip);

    let login_fetch = await fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            msisdn: number,
            ip: ip_user
        })
    });
    let login = await login_fetch.json();
    sessionStorage.setItem("code", login.code);
    if(login.msg === "sms"){
        show_sms_input();
    }else if(login.msg === "already registered"){
        remove_register();
    }
}

function show_sms_input(){
    document.getElementById("smscode").classList.remove("smscode-input-noner");
    document.getElementById("smscode_input").classList.add("smscode-input");
}
function remove_register(){
    document.getElementById("register").classList.add("smscode-input-noner");
    // make it's height 0
    document.getElementById("register").style.height = "0";
    // make whole body height 100vh
    document.getElementsByTagName("body")[0].style.height = "100vh";
}

// track smscode input when typing
document.getElementById("smscode").addEventListener("input", function(){
    let smscode = document.getElementById("smscode").value;
    if(smscode.length === 4){
        if(smscode === sessionStorage.getItem("code")){
            console.log("ok");
            remove_register();
        }else{
            console.log("wrong code");
        }
    }
});
