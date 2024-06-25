# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jaromero <jaromero@student.42malaga.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/01/29 09:53:56 by jaromero          #+#    #+#              #
#    Updated: 2024/06/23 09:07:40 by jaromero         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

all:	load

load:	
		@ ./nginx/config/cfgBackend.sh;
		@if ! [ $$(docker ps -q | wc -l) -gt 0 ]; then 					\
			docker-compose -f docker-compose.yml up --build;			\
		else															\
			echo "Containers are running!";								\
		fi

stop:	
		@if [ $$(docker ps -q | wc -l) -gt 0 ]; then 		\
        	echo "Stopping containers..."; 					\
			docker-compose -f docker-compose.yml down; 		\
    	else 												\
        	echo "No containers are running!"; 				\
   		fi

rmi:
		@if [ $$(docker images -q | wc -l) -gt 0 ]; then 	\
        	echo "Deleting images..."; 						\
			docker rmi -f `docker images -q`;				\
    	else 												\
        	echo "No images are build's!"; 					\
   		fi

rmvol:
		@if [ $$(docker volume ls -q | wc -l) -gt 0 ]; then				\
			echo "Deleting volumes...";									\
			docker volume prune --force;								\
			docker volume rm django postgresql nginx django_IMGs;		\
		else															\
			echo "No volumes are build's!";								\
		fi

clean:	stop

fclean:	clean rmi
		@docker system prune -f

status:
		@echo "Containers running...";
		@docker ps
		@echo "Images builders...";
		@docker images
		@echo "Volumes builders...";
		@docker volume ls	
		@echo "Networks builders...";
		@docker network ls	

.PHONY: stop rmi rmvol fclean clean prune reload all