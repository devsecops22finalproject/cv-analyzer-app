pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out application repository...'
                checkout scm
            }
        }


        stage('Checkout Infrastructure') {
            steps {
                dir('infrastructure') {
                    git branch: 'main',
                        url: 'https://github.com/devsecops22finalproject/cv-analyzer-infra.git'
                    sh 'ls -la'
                }
            }
        }


        stage('Automated Tests') {
            steps {
                sh '''
                    docker run --rm                       -v jenkins_home:/jenkins_home -w "/jenkins_home/workspace/$JOB_NAME/backend"                                              python:3.11-slim                       sh -c "pip install -q -r requirements.txt && python -m pytest tests/ -v"
                '''
            }
        }


        stage('Docker Build') {
            steps {
                sh '''
                    docker run --rm \
                      -v jenkins_home:/jenkins_home \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -w "/jenkins_home/workspace/$JOB_NAME" \
                      docker:29-cli \
                      sh -c "docker build -t cv-analyzer-backend:latest ./backend && docker build -t cv-analyzer-frontend:latest ./frontend"
                '''
            }
        }

        stage('Verify') {
            steps {
                sh 'ls -la'
                echo 'Application repository checkout completed!'
            }
        }
    }
}
