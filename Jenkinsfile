pipeline {

    agent any

    environment {
        FRONTEND_IMAGE = 'rifaz15072000/cicd-frontend'
        BACKEND_IMAGE  = 'rifaz15072000/cicd-backend'

        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"

        PROJECT_DIR = 'C:\\cicd-project'
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {

        // ───────── SOURCE ─────────
        stage('Source') {
            steps {
                echo "============================================"
                echo " CI/CD Pipeline Starting"
                echo " Build     : #${env.BUILD_NUMBER}"
                echo " Commit    : ${env.GIT_COMMIT?.take(7) ?: 'N/A'}"
                echo " Image Tag : ${IMAGE_TAG}"
                echo "============================================"
                bat 'dir'
            }
        }

        // ───────── BUILD ─────────
        stage('Build') {
            steps {
                echo "Building Docker images..."

                bat """
                docker build ^
                  -f Dockerfile.frontend ^
                  -t %FRONTEND_IMAGE%:%IMAGE_TAG% ^
                  -t %FRONTEND_IMAGE%:latest ^
                  .
                """

                bat """
                docker build ^
                  -f Dockerfile.backend ^
                  -t %BACKEND_IMAGE%:%IMAGE_TAG% ^
                  -t %BACKEND_IMAGE%:latest ^
                  .
                """

                echo "Build completed"
            }
        }

        // ───────── PUSH ─────────
        stage('Push') {
            steps {
                echo "Logging into Docker Hub..."

                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    bat '''
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    '''

                    echo "Pushing frontend image..."
                    bat '''
                    docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
                    docker push %FRONTEND_IMAGE%:latest
                    '''

                    echo "Pushing backend image..."
                    bat '''
                    docker push %BACKEND_IMAGE%:%IMAGE_TAG%
                    docker push %BACKEND_IMAGE%:latest
                    '''
                }
            }
            post {
                always {
                    bat 'docker logout'
                }
            }
        }

        // ───────── DEPLOY ─────────
        stage('Deploy') {
            steps {
                echo "Deploying using docker-compose..."

                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    bat """
                    cd /d %PROJECT_DIR%
                    set DOCKER_HUB_USERNAME=%DOCKER_USER%
                    set IMAGE_TAG=%IMAGE_TAG%
                    docker compose pull
                    """

                    bat """
                    cd /d %PROJECT_DIR%
                    set DOCKER_HUB_USERNAME=%DOCKER_USER%
                    set IMAGE_TAG=%IMAGE_TAG%
                    docker compose up -d --force-recreate
                    """
                }

                bat "docker compose -f %PROJECT_DIR%\\docker-compose.yml ps"
                bat "docker image prune -f"

                echo "Deployment completed"
            }
        }

        // ───────── VERIFY ─────────
        stage('Verify') {
            steps {
                echo "Running health check..."

                bat 'if not exist C:\\Temp mkdir C:\\Temp'
                sleep 20

                script {
                    def url = "http://localhost/api/health"
                    def success = false

                    for (int i = 1; i <= 5; i++) {
                        echo "Attempt ${i}..."

                        def status = bat(
                            script: "curl.exe -s -o C:\\Temp\\health.json -w \"%%{http_code}\" ${url}",
                            returnStdout: true
                        ).trim().readLines().last()

                        echo "HTTP Status: ${status}"

                        if (status == "200") {
                            echo "Health check PASSED"
                            bat 'type C:\\Temp\\health.json'
                            success = true
                            break
                        }

                        sleep 10
                    }

                    if (!success) {
                        error("Health check FAILED")
                    }
                }
            }
        }
    }

    // ───────── POST ─────────
    post {
        success {
            echo "============================================"
            echo " PIPELINE SUCCESS — Build #${env.BUILD_NUMBER}"
            echo " App    : http://localhost"
            echo " Health : http://localhost/api/health"
            echo "============================================"
        }

        failure {
            echo "============================================"
            echo " PIPELINE FAILED — Build #${env.BUILD_NUMBER}"
            echo " Run: docker compose -f C:\\cicd-project\\docker-compose.yml logs"
            echo "============================================"
        }

        always {
            cleanWs()
        }
    }
}
