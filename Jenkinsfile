// ════════════════════════════════════════════════════════════════════════
// Jenkinsfile  (Declarative Pipeline)
// CI/CD Pipeline — Jenkins on Windows Server 2022 (Single VM Setup)
//
// Setup:
//   - Jenkins        : Running on Windows Server 2022 EC2
//   - Docker Runtime : Mirantis Container Runtime (MCR)
//   - Docker Hub     : rifaz15072000
//   - Deploy Target  : Same Windows Server 2022 EC2 (localhost)
//
// Required Jenkins Credentials (Manage Jenkins → Credentials):
//   DOCKER_HUB_TOKEN  — Secret text  → your Docker Hub Access Token
//
// ════════════════════════════════════════════════════════════════════════

pipeline {

    // Run on the Jenkins agent built into this Windows machine
    agent any

    environment {
        // Docker Hub username (hardcoded as per your setup)
        DOCKER_HUB_USERNAME = 'rifaz15072000'

        // Docker Hub Access Token — stored securely in Jenkins Credentials
        DOCKER_HUB_TOKEN = credentials('DOCKER_HUB_TOKEN')

        // Image names
        FRONTEND_IMAGE = "rifaz15072000/cicd-frontend"
        BACKEND_IMAGE  = "rifaz15072000/cicd-backend"

        // Tag: Jenkins build number + first 7 chars of Git commit SHA
        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"

        // Project directory on THIS Windows machine
        PROJECT_DIR = 'C:\\cicd-project'
    }

    // Poll SCM every 2 minutes as fallback (replace with GitHub webhook for instant triggers)
    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {

        // ── STAGE 1: SOURCE ───────────────────────────────────────────
        // Jenkins checks out the repo from GitHub automatically.
        // This stage confirms the workspace and prints build info.
        stage('Source') {
            steps {
                echo "============================================"
                echo " CI/CD Pipeline Starting"
                echo " Build     : #${env.BUILD_NUMBER}"
                echo " Commit    : ${env.GIT_COMMIT?.take(7) ?: 'N/A'}"
                echo " Image Tag : ${IMAGE_TAG}"
                echo "============================================"

                // List workspace contents to confirm checkout succeeded
                bat 'dir'
            }
        }

        // ── STAGE 2: BUILD ────────────────────────────────────────────
        // Build Docker images using MCR (docker command works same as Docker Desktop)
        // Tag each image with both the build-specific tag and 'latest'
        stage('Build') {
            steps {
                echo "Building Docker images with tag: ${IMAGE_TAG}"

                // Build Frontend image
                bat """
                    docker build ^
                        -t %FRONTEND_IMAGE%:%IMAGE_TAG% ^
                        -t %FRONTEND_IMAGE%:latest ^
                        frontend
                """

                // Build Backend image
                bat """
                    docker build ^
                        -t %BACKEND_IMAGE%:%IMAGE_TAG% ^
                        -t %BACKEND_IMAGE%:latest ^
                        backend
                """

                echo "Images built successfully"

                // Confirm images exist locally
                bat 'docker images | findstr rifaz15072000'
            }
        }

        // ── STAGE 3: PUSH ─────────────────────────────────────────────
        // Login to Docker Hub using the stored access token and push both images
        stage('Push') {
            steps {
                echo "Pushing images to Docker Hub (rifaz15072000)..."

                // Login using Access Token piped via echo
                bat "echo %DOCKER_HUB_TOKEN% | docker login -u %DOCKER_HUB_USERNAME% --password-stdin"

                // Push frontend — both tags
                bat """
                    docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
                    docker push %FRONTEND_IMAGE%:latest
                """

                // Push backend — both tags
                bat """
                    docker push %BACKEND_IMAGE%:%IMAGE_TAG%
                    docker push %BACKEND_IMAGE%:latest
                """

                echo "Images pushed to Docker Hub successfully"
            }
            post {
                always {
                    // Always log out after pushing — security best practice
                    bat 'docker logout'
                }
            }
        }

        // ── STAGE 4: DEPLOY ───────────────────────────────────────────
        // Since Jenkins is on the SAME machine as the deployment target,
        // we run docker compose commands directly — no SSH needed.
        stage('Deploy') {
            steps {
                echo "Deploying containers on this machine (localhost)..."

                // Pull the latest images we just pushed from Docker Hub
                bat """
                    cd /d %PROJECT_DIR%
                    set DOCKER_HUB_USERNAME=%DOCKER_HUB_USERNAME%
                    set IMAGE_TAG=%IMAGE_TAG%
                    docker compose pull
                """

                // Recreate all containers with the new images
                // --force-recreate ensures containers are replaced even if config unchanged
                bat """
                    cd /d %PROJECT_DIR%
                    set DOCKER_HUB_USERNAME=%DOCKER_HUB_USERNAME%
                    set IMAGE_TAG=%IMAGE_TAG%
                    docker compose up -d --force-recreate
                """

                // Show running containers for confirmation
                bat "docker compose -f %PROJECT_DIR%\\docker-compose.yml ps"

                // Remove dangling old images to free disk space
                bat 'docker image prune -f'

                echo "Containers restarted successfully"
            }
        }

        // ── STAGE 5: VERIFY ───────────────────────────────────────────
        // Call GET http://localhost/api/health
        // Pipeline FAILS if HTTP 200 is not returned within 5 attempts
        stage('Verify') {
            steps {
                echo "Verifying deployment via health check endpoint..."

                // Ensure temp directory exists for saving the response body
                bat 'if not exist C:\\Temp mkdir C:\\Temp'

                // Wait for containers to fully start before first check
                sleep(time: 20, unit: 'SECONDS')

                script {
                    def healthUrl  = 'http://localhost/api/health'
                    def maxRetries = 5
                    def passed     = false

                    for (int i = 1; i <= maxRetries; i++) {
                        echo "Health check attempt ${i} of ${maxRetries} — GET ${healthUrl}"

                        // curl.exe ships natively on Windows Server 2022
                        // -s = silent, -o = save body to file, -w = print only status code
                        def rawOutput = bat(
                            script: "curl.exe -s -o C:\\Temp\\health_response.json -w \"%%{http_code}\" ${healthUrl}",
                            returnStdout: true
                        ).trim()

                        // bat() prepends the command itself in stdout — take the last line only
                        def statusCode = rawOutput.readLines().last().trim()
                        echo "HTTP Status: ${statusCode}"

                        if (statusCode == '200') {
                            echo "Health check PASSED"
                            bat 'type C:\\Temp\\health_response.json'
                            passed = true
                            break
                        }

                        if (i < maxRetries) {
                            echo "Not ready yet. Retrying in 10 seconds..."
                            sleep(time: 10, unit: 'SECONDS')
                        }
                    }

                    if (!passed) {
                        // error() marks the Jenkins build as FAILED (shown in red)
                        error("HEALTH CHECK FAILED after ${maxRetries} attempts. Check container logs with: docker compose -f C:\\cicd-project\\docker-compose.yml logs")
                    }
                }
            }
        }
    }

    // ── Post-pipeline actions ──────────────────────────────────────────
    post {
        success {
            echo "============================================"
            echo " PIPELINE SUCCEEDED"
            echo " Build #${env.BUILD_NUMBER} deployed and verified"
            echo " App URL   : http://localhost"
            echo " Health    : http://localhost/api/health"
            echo "============================================"
        }
        failure {
            echo "============================================"
            echo " PIPELINE FAILED — Build #${env.BUILD_NUMBER}"
            echo " Debug with: docker compose -f C:\\cicd-project\\docker-compose.yml logs"
            echo "============================================"
        }
        always {
            // Wipe Jenkins workspace after every build to save disk space
            cleanWs()
        }
    }
}
