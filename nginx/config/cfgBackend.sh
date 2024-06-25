#!/bin/bash

IP_pong=$(ifconfig enp6s0 | grep 'inet ' | awk '{print $2}')

sed -i '/^IP_BACKEND=/d' .env
echo -n "IP_BACKEND=$IP_pong" >> .env