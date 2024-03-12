FROM --platform=linux/amd64 alloranetwork/allora-inference-base:latest

USER root
RUN chown -R $GROUP_ID:$USER_ID /app
RUN pip install requests

USER appuser
COPY main.py /app/