FROM python:3.10-alpine

# to use flask we need to install it (e.g. for web server)
RUN pip install flask

WORKDIR /app

# copy everything form the host into the container
COPY app/ .

CMD ["python", "service2.py"]