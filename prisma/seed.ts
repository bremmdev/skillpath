import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { techdata, projectdata, featuredata } from "./seeddata";

async function clearDatabase() {
  await prisma.$transaction([
    prisma.project.deleteMany(),
    prisma.feature.deleteMany(),
    prisma.tech.deleteMany(),
  ]);
}

async function createTechData() {
  await prisma.tech.createMany({
    data: techdata,
  });
}

function createProjectData() {
  return projectdata.map((project) => prisma.project.create({ data: project }));
}

async function createFeatureData() {
  await prisma.feature.createMany({
    data: featuredata,
  });
}

async function seed() {
  console.time("seed");
  await clearDatabase();
  await createTechData();
  await prisma.$transaction([...createProjectData()]);
  await createFeatureData();
  console.timeEnd("seed");
}

seed();
