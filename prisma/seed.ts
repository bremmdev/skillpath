import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import {
  techdata,
  projectstatusdata,
  projectdata,
  activitydata,
} from "./seeddata";

async function clearDatabase() {
  await prisma.$transaction([
    prisma.tech.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.project.deleteMany(),
    prisma.projectStatus.deleteMany(),
  ]);
}

async function createTechData() {
  await prisma.tech.createMany({
    data: techdata,
  });
}

async function createProjectStatusData() {
  await prisma.projectStatus.createMany({
    data: projectstatusdata,
  });
}

function createActivityData() {
  return activitydata.map((activity) =>
    prisma.activity.create({ data: activity })
  );
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
  await prisma.$transaction([...createActivityData()]);
  console.timeEnd("seed");
}

seed();
