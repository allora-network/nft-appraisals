FROM --platform=linux/amd64 696230526504.dkr.ecr.us-east-1.amazonaws.com/allora-inference-base:latest

USER root
RUN chown -R $GROUP_ID:$USER_ID /app
RUN pip install requests

USER appuser
COPY main.py /app/