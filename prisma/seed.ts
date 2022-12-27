import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import {
  techdata,
  projectstatusdata,
  projectdata,
  featuredata,
} from "./seeddata";

async function clearDatabase() {
  await prisma.$transaction([
    prisma.project.deleteMany(),
    prisma.projectStatus.deleteMany(),
    prisma.feature.deleteMany(),
    prisma.tech.deleteMany(),
  ]);
}

async function createTechData() {
  await prisma.tech.createMany({
    data: techdata,
  });
}

async function createFeatureData() {
  await prisma.feature.createMany({
    data: featuredata,
  });
}

async function createProjectStatusData() {
  await prisma.projectStatus.createMany({
    data: projectstatusdata,
  });
}

function createProjectData() {
  //create sublimetrack and skillpath project
  return projectdata.map((project) => prisma.project.create({ data: project }));
}

async function seed() {
  console.time("seed");
  await clearDatabase();
  await createTechData();
  await createProjectStatusData();
  await prisma.$transaction([...createProjectData()]);
  await createFeatureData();
  console.timeEnd("seed");
}

seed();
