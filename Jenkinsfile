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


        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_TOKEN'
                )]) {
                    sh '''
                        set +x
                        echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USER" --password-stdin
                        docker tag cv-analyzer-backend:latest "$DOCKER_USER/cv-analyzer-backend:latest"
                        docker tag cv-analyzer-frontend:latest "$DOCKER_USER/cv-analyzer-frontend:latest"
                        docker push "$DOCKER_USER/cv-analyzer-backend:latest"
                        docker push "$DOCKER_USER/cv-analyzer-frontend:latest"
                        docker logout
                    '''
                }
            }
        }


        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    export KUBECONFIG=/var/jenkins_home/kubeconfig

                    kubectl -n job-screener set image deployment/backend backend=eliaor360/cv-analyzer-backend:latest
                    kubectl -n job-screener set image deployment/frontend frontend=eliaor360/cv-analyzer-frontend:latest

                    kubectl -n job-screener patch deployment backend --type=strategic -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","imagePullPolicy":"Always"}]}}}}'
                    kubectl -n job-screener patch deployment frontend --type=strategic -p '{"spec":{"template":{"spec":{"containers":[{"name":"frontend","imagePullPolicy":"Always"}]}}}}'

                    kubectl -n job-screener rollout restart deployment/backend
                    kubectl -n job-screener rollout restart deployment/frontend

                    kubectl -n job-screener rollout status deployment/backend --timeout=300s
                    kubectl -n job-screener rollout status deployment/frontend --timeout=300s
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
