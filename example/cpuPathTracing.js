import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { bsdfSample } from './pathtracing/materialSampling.js';

import { GUI } from 'dat.gui';
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
	SAH,
	CENTER,
} from '../src/index.js';
import {
	GenerateMeshBVHWorker,
} from '../src/workers/GenerateMeshBVHWorker.js';
import { ANTIALIAS_OFFSETS, ANTIALIAS_WIDTH, EPSILON, getBasisFromNormal } from './pathtracing/utils.js';
import '@babel/polyfill';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

let scene, camera, renderer, light, clock;
let fsQuad, controls;
let dataTexture, samples, ssPoint, task, delay, scanLinePercent;
let scanLineElement, containerElement, outputContainer;
let renderStartTime, computationTime;
let mesh, materials, lightMesh, floorMesh;
const DELAY_TIME = 300;
const FADE_DELAY = 150;
const triangle = new THREE.Triangle();
const normal0 = new THREE.Vector3();
const normal1 = new THREE.Vector3();
const normal2 = new THREE.Vector3();
const barycoord = new THREE.Vector3();
const spherical = new THREE.Spherical();
const normalBasis = new THREE.Matrix4();
const invBasis = new THREE.Matrix4();
const localDirection = new THREE.Vector3();
const tempColor = new THREE.Color();

const models = {};
const params = {
	model: 'Dragon',
	resolution: {
		resolutionScale: 2,
		smoothImageScaling: false,
		stretchImage: true,
	},
	pathTracing: {
		pause: false,
		displayScanLine: false,
		antialiasing: true,
		bounces: 5,
		smoothNormals: true,
		directLightSampling: true,
	},
	material: {
		color: '#0099ff',
		emissive: '#000000',
		emissiveIntensity: 1,
		roughness: 0.1,
		metalness: 0.1,
		ior: 1.8,
		transmission: 0.0,
	},
	floor: {
		enable: true,
		color: '#7f7f7f',
		roughness: 0.5,
		metalness: 0.5,
	},
	light: {
		enable: true,
		intensity: 5.0,
		color: '#ffffff',
		width: 1,
		height: 1,
	},
	environment: {
		skyMode: 'sky',
		skyIntensity: 1.0,
	}
};

init();
render();

function init() {

	// renderer setup
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0, 1 );
	renderer.outputEncoding = THREE.sRGBEncoding;

	// container of the canvas and scan line to be centered
	containerElement = document.createElement( 'div' );
	containerElement.style.position = 'absolute';
	containerElement.style.inset = '0';
	containerElement.style.margin = 'auto';
	document.body.appendChild( containerElement );
	containerElement.appendChild( renderer.domElement );

	// scan line element for tracking render progress
	scanLineElement = document.createElement( 'div' );
	scanLineElement.style.width = '100%';
	scanLineElement.style.position = 'absolute';
	scanLineElement.style.borderBottom = '1px solid #e91e63';
	scanLineElement.style.visibility = 'hidden';
	containerElement.appendChild( scanLineElement );

	outputContainer = document.getElementById( 'output' );

	fsQuad = new FullScreenQuad( new THREE.MeshBasicMaterial() );
	fsQuad.material.transparent = true;

	// scene setup
	scene = new THREE.Scene();

	// camera setup
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 50 );
	camera.position.set( - 2.5, 1.5, 2.5 );
	camera.far = 100;
	camera.updateProjectionMatrix();

	// light
	light = new THREE.HemisphereLight( 0xffffff, 0x666666, 1 );
	scene.add( light );

	lightMesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 1, 1, 1, 1 ),
		new THREE.MeshBasicMaterial( { side: THREE.DoubleSide } ),
	);
	lightMesh.position.set( 2, 2, 2 );
	lightMesh.lookAt( 0, 0, 0 );
	scene.add( lightMesh );

	floorMesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 10, 10, 1, 1 ),
		new THREE.MeshStandardMaterial( { side: THREE.DoubleSide } ),
	);
	floorMesh.rotation.x = - Math.PI / 2;
	floorMesh.scale.setScalar( 1 );
	floorMesh.material.ior = 1.6;
	floorMesh.material.transmission = 0;
	scene.add( floorMesh );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', resetImage );

	window.addEventListener( 'resize', onResize, false );
	onResize();

	// Load sphere
	models[ 'Sphere' ] = null;
	{

		const sphereMesh = new THREE.Mesh(
			new THREE.SphereBufferGeometry(),
			new THREE.MeshStandardMaterial(),
		);

		const { geometry, materials } = mergeMeshes( [ sphereMesh ], true );
		const merged = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial() );
		scene.add( merged );

		geometry.computeBoundsTree( { strategy: SAH, maxLeafTris: 1 } );
		models[ 'Sphere' ] = { mesh: merged, materials, floorHeight: - 1 };

	}

	models[ 'Cornell Box' ] = null;
	{

		const planeGeom = new THREE.PlaneBufferGeometry( 1, 1, 1, 1 );
		const leftWall = new THREE.Mesh(
			planeGeom,
			new THREE.MeshStandardMaterial( {
				color: 0x00ee00,
				side: THREE.DoubleSide,
				// roughness: 0.5,
			} )
		);
		leftWall.rotation.y = Math.PI / 2;
		leftWall.position.x = - 2;
		leftWall.scale.setScalar( 4 );
		leftWall.updateMatrixWorld( true );

		const rightWall = new THREE.Mesh(
			planeGeom,
			new THREE.MeshStandardMaterial( {
				color: 0xee0000,
			} ),
		);
		rightWall.rotation.y = Math.PI / 2;
		rightWall.position.x = 2;
		rightWall.scale.setScalar( 4 );
		rightWall.updateMatrixWorld( true );

		const backWall = new THREE.Mesh(
			planeGeom,
			new THREE.MeshStandardMaterial( {
				color: 0xeeeeee,
			} ),
		);
		backWall.position.z = - 2;
		backWall.scale.setScalar( 4 );
		backWall.updateMatrixWorld( true );

		const ceiling = new THREE.Mesh(
			planeGeom.clone(),
			new THREE.MeshStandardMaterial( {
				color: 0xeeeeee,
			} ),
		);
		ceiling.rotation.x = Math.PI / 2;
		ceiling.position.y = 2;
		ceiling.scale.setScalar( 4 );
		ceiling.updateMatrixWorld( true );

		const light = new THREE.Mesh(
			planeGeom.clone(),
			new THREE.MeshStandardMaterial( {
				color: 0x7f7f7f,
				emissive: 0xffffff,
				emissiveIntensity: 15.0,
			} ),
		);
		light.rotation.x = Math.PI / 2;
		light.position.y = 1.999;
		light.scale.setScalar( 1 );
		light.updateMatrixWorld( true );

		const box = new THREE.Mesh(
			new THREE.BoxBufferGeometry( 1, 2, 1 ),
			new THREE.MeshStandardMaterial( {
				side: THREE.DoubleSide,
			} ),
		);
		box.position.y = - 1.0;
		box.position.x = - 0.5;
		box.rotation.y = Math.PI / 4;

		const { geometry, materials } = mergeMeshes( [ box, leftWall, rightWall, backWall, ceiling, light ], true );
		const merged = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial() );
		scene.add( merged );

		geometry.computeBoundsTree( { strategy: SAH, maxLeafTris: 1 } );
		models[ 'Cornell Box' ] = { mesh: merged, materials, floorHeight: - 2 };

	}

	// Load dragon
	models[ 'Dragon' ] = null;
	new GLTFLoader().load( '../models/DragonAttenuation.glb', gltf => {

		let mesh;
		gltf.scene.traverse( c => {

			if ( c.isMesh && c.name === 'Dragon' ) {

				mesh = c;

			}

		} );

		mesh.material = new THREE.MeshStandardMaterial();
		mesh.geometry.center().scale( 0.25, 0.25, 0.25 ).rotateX( Math.PI / 2 );
		mesh.position.set( 0, 0, 0 );
		mesh.scale.set( 1, 1, 1 );
		mesh.quaternion.identity();

		const { geometry, materials } = mergeMeshes( [ mesh ], true );
		const merged = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial() );
		const generator = new GenerateMeshBVHWorker();
		generator
			.generate( geometry, { maxLeafTris: 1, strategy: SAH } )
			.then( bvh => {

				models[ 'Dragon' ] = { mesh: merged, materials, floorHeight: mesh.geometry.boundingBox.min.y };
				geometry.boundsTree = bvh;
				generator.terminate();
				scene.add( merged );

			} );

	} );

	models[ 'Engine' ] = null;
	new GLTFLoader().setMeshoptDecoder( MeshoptDecoder ).load( '../models/internal_combustion_engine/model.gltf', gltf => {

		const originalMesh = gltf.scene.children[ 0 ];
		const originalGeometry = originalMesh.geometry;
		const newGeometry = new THREE.BufferGeometry();

		const ogPosAttr = originalGeometry.attributes.position;
		const ogNormAttr = originalGeometry.attributes.normal;
		const posAttr = new THREE.BufferAttribute( new Float32Array( ogPosAttr.count * 3 ), 3, false );
		const normAttr = new THREE.BufferAttribute( new Float32Array( ogNormAttr.count * 3 ), 3, false );

		const vec = new THREE.Vector3();
		for ( let i = 0, l = ogPosAttr.count; i < l; i ++ ) {

			vec.fromBufferAttribute( ogPosAttr, i );
			posAttr.setXYZ( i, vec.x, vec.y, vec.z );

			vec.fromBufferAttribute( ogNormAttr, i );
			vec.multiplyScalar( 1 / 127 );
			normAttr.setXYZ( i, vec.x, vec.y, vec.z );

		}

		originalMesh.scale.multiplyScalar( 5 );
		originalMesh.updateMatrixWorld();
		newGeometry.setAttribute( 'position', posAttr );
		newGeometry.setAttribute( 'normal', normAttr );
		newGeometry.setAttribute( 'materialIndex', new THREE.BufferAttribute( new Uint8Array( posAttr.count ), 1, false ) );
		newGeometry.setIndex( originalGeometry.index );
		newGeometry.applyMatrix4( originalMesh.matrixWorld ).center();
		newGeometry.computeBoundingBox();

		const mesh = new THREE.Mesh( newGeometry, new THREE.MeshStandardMaterial() );
		const generator = new GenerateMeshBVHWorker();
		generator
			.generate( newGeometry, { maxLeafTris: 1, strategy: CENTER } )
			.then( bvh => {

				models[ 'Engine' ] = { mesh, materials: [ new THREE.MeshStandardMaterial() ], floorHeight: newGeometry.boundingBox.min.y };
				newGeometry.boundsTree = bvh;
				generator.terminate();

				scene.add( mesh );

			} );

	} );

	models[ 'Rover' ] = null;
	new GLTFLoader().load( '../models/Perseverance.glb', gltf => {

		const meshes = [];
		gltf.scene.updateMatrixWorld( true );
		gltf.scene.traverse( c => {

			if ( c.isMesh ) {

				const g = c.geometry;
				for ( const key in g.attributes ) {

					if ( key !== 'position' && key !== 'normal' ) {

						delete g.attributes[ key ];

					}

				}

				meshes.push( c );

			}

		} );

		const { geometry, materials } = mergeMeshes( [ ...meshes ], true );
		geometry.center();
		geometry.computeBoundingBox();

		const mesh = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial() );
		const generator = new GenerateMeshBVHWorker();
		generator
			.generate( geometry, { maxLeafTris: 1, strategy: SAH } )
			.then( bvh => {

				models[ 'Rover' ] = { mesh, materials, floorHeight: geometry.boundingBox.min.y };
				geometry.boundsTree = bvh;
				generator.terminate();

				scene.add( mesh );

			} );

	} );

	ssPoint = new THREE.Vector3();
	samples = 0;
	clock = new THREE.Clock();

	const gui = new GUI();
	gui.add( params, 'model', Object.keys( models ) ).onChange( resetImage );

	const resolutionFolder = gui.addFolder( 'resolution' );
	resolutionFolder.add( params.resolution, 'resolutionScale', 1, 5, 1 ).onChange( onResize );
	resolutionFolder.add( params.resolution, 'smoothImageScaling' ).onChange( onResize );
	resolutionFolder.add( params.resolution, 'stretchImage' ).onChange( onResize );
	resolutionFolder.open();

	const pathTracingFolder = gui.addFolder( 'path tracing' );
	pathTracingFolder.add( params.pathTracing, 'pause' );
	pathTracingFolder.add( params.pathTracing, 'displayScanLine' ).onChange( v => {

		scanLineElement.style.visibility = v ? 'visible' : 'hidden';

	} );
	pathTracingFolder.add( params.pathTracing, 'antialiasing' ).onChange( resetImage );
	pathTracingFolder.add( params.pathTracing, 'directLightSampling' ).onChange( resetImage );
	pathTracingFolder.add( params.pathTracing, 'smoothNormals' ).onChange( resetImage );
	pathTracingFolder.add( params.pathTracing, 'bounces', 1, 30, 1 ).onChange( resetImage );
	pathTracingFolder.open();

	const materialFolder = gui.addFolder( 'model' );
	materialFolder.addColor( params.material, 'color' ).onChange( resetImage );
	materialFolder.addColor( params.material, 'emissive' ).onChange( resetImage );
	materialFolder.add( params.material, 'emissiveIntensity', 0, 5, 0.001 ).onChange( resetImage );
	materialFolder.add( params.material, 'roughness', 0, 1.0, 0.001 ).onChange( resetImage );
	materialFolder.add( params.material, 'metalness', 0, 1.0, 0.001 ).onChange( resetImage );
	materialFolder.add( params.material, 'transmission', 0, 1.0, 0.001 ).onChange( resetImage );
	materialFolder.add( params.material, 'ior', 1.0, 2.5, 0.001 ).onChange( resetImage );
	materialFolder.open();

	const floorFolder = gui.addFolder( 'floor' );
	floorFolder.addColor( params.floor, 'color' ).onChange( resetImage );
	floorFolder.add( params.floor, 'roughness', 0, 1, 0.001 ).onChange( resetImage );
	floorFolder.add( params.floor, 'metalness', 0, 1, 0.001 ).onChange( resetImage );

	const lightFolder = gui.addFolder( 'light' );
	lightFolder.add( params.light, 'enable' ).onChange( resetImage );
	lightFolder.addColor( params.light, 'color' ).onChange( resetImage );
	lightFolder.add( params.light, 'intensity', 0, 20, 0.0001 ).onChange( resetImage );
	lightFolder.add( params.light, 'width', 0, 5, 0.0001 ).onChange( resetImage );
	lightFolder.add( params.light, 'height', 0, 5, 0.0001 ).onChange( resetImage );

	const envFolder = gui.addFolder( 'environment' );
	envFolder.add( params.environment, 'skyMode', [ 'sky', 'sun', 'checkerboard' ] ).onChange( resetImage );
	envFolder.add( params.environment, 'skyIntensity', 0, 2, 0.001 ).onChange( resetImage );

	onResize();

}

function mergeMeshes( meshes, cloneGeometry = true ) {

	const transformedGeometry = [];
	const materials = [];
	for ( let i = 0, l = meshes.length; i < l; i ++ ) {

		const mesh = meshes[ i ];
		const originalGeometry = meshes[ i ].geometry;
		const geom = cloneGeometry ? originalGeometry.clone() : cloneGeometry;
		mesh.updateMatrixWorld();
		geom.applyMatrix4( mesh.matrixWorld );

		const vertexCount = geom.attributes.position.count;
		const materialIndexArray = new Uint8Array( vertexCount ).fill( i );
		geom.setAttribute( 'materialIndex', new THREE.BufferAttribute( materialIndexArray, 1, false ) );

		transformedGeometry.push( geom );
		materials.push( mesh.material );

	}

	const geometry = BufferGeometryUtils.mergeBufferGeometries( transformedGeometry, false );
	return { geometry, materials };

}

function onResize() {

	function resizeDataTexture( w, h ) {

		if ( ! dataTexture || dataTexture.image.width !== w || dataTexture.image.height !== h ) {

			if ( dataTexture ) {

				dataTexture.dispose();

			}

			dataTexture = new THREE.DataTexture( new Float32Array( w * h * 4 ), w, h, THREE.RGBAFormat, THREE.FloatType );
			resetImage();

		}

	}

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	const dpr = window.devicePixelRatio;
	const divisor = Math.pow( 2, parseFloat( params.resolution.resolutionScale ) - 1 );
	if ( params.resolution.stretchImage ) {

		containerElement.style.width = `${ window.innerWidth }px`;
		containerElement.style.height = `${ window.innerHeight }px`;
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setPixelRatio( dpr / divisor );
		resizeDataTexture(
			Math.floor( window.innerWidth * dpr / divisor ),
			Math.floor( window.innerHeight * dpr / divisor ),
		);

	} else {

		containerElement.style.width = `${ window.innerWidth / divisor }px`;
		containerElement.style.height = `${ window.innerHeight / divisor }px`;
		renderer.setSize(
			Math.floor( window.innerWidth / divisor ),
			Math.floor( window.innerHeight / divisor )
		);
		renderer.setPixelRatio( dpr );
		resizeDataTexture(
			Math.floor( window.innerWidth * dpr / divisor ),
			Math.floor( window.innerHeight * dpr / divisor ),
		);

	}

	renderer.domElement.style.imageRendering = params.resolution.smoothImageScaling ? 'auto' : 'pixelated';

}

function resetImage() {

	dataTexture.image.data.fill( 0 );
	dataTexture.needsUpdate = true;
	samples = 0;
	task = runPathTracingLoop();
	delay = 0;
	scanLineElement.style.visibility = 'hidden';
	scanLinePercent = 100;

	lightMesh.scale.set( params.light.width, params.light.height, 1 );
	lightMesh.material.color.set( params.light.color ).multiplyScalar( params.light.intensity );

	floorMesh.material.color.set( params.floor.color );
	floorMesh.material.roughness = Math.pow( params.floor.roughness, 2.0 );
	floorMesh.material.metalness = params.floor.metalness, 2.0;

}

function* runPathTracingLoop() {

	let lastStartTime = performance.now();
	const { width, height, data } = dataTexture.image;
	const bounces = parseInt( params.pathTracing.bounces );
	const skyIntensity = parseFloat( params.environment.skyIntensity );
	const skyMode = params.environment.skyMode;
	const smoothNormals = params.pathTracing.smoothNormals;
	const radianceColor = new THREE.Color();
	const throughputColor = new THREE.Color();
	const normal = new THREE.Vector3();
	const rayStack = new Array( bounces ).fill().map( () => new THREE.Ray() );
	const lightForward = new THREE.Vector3( 0, 0, 1 ).transformDirection( lightMesh.matrixWorld );
	const lightWidth = lightMesh.scale.x;
	const lightHeight = lightMesh.scale.y;
	const raycaster = new THREE.Raycaster();
	raycaster.firstHitOnly = true;

	const sampleInfo = {
		pdf: 0,
		color: new THREE.Color(),
		direction: new THREE.Vector3(),
	};
	renderStartTime = performance.now();
	computationTime = 0;
	scanLinePercent = 100;
	scanLineElement.style.visibility = params.pathTracing.displayScanLine ? 'visible' : 'hidden';

	// ensure the materials are all set to double side for transmissive rendering
	materials.forEach( material => {

		material.side = THREE.DoubleSide;

	} );

	mesh.material.side = THREE.DoubleSide;

	while ( true ) {

		const antiAliasIndex = ( samples ) % ANTIALIAS_OFFSETS.length;
		let [ randomOffsetX, randomOffsetY ] = ANTIALIAS_OFFSETS[ antiAliasIndex ];
		randomOffsetX = ( randomOffsetX / ANTIALIAS_WIDTH ) / width;
		randomOffsetY = ( randomOffsetY / ANTIALIAS_WIDTH ) / height;

		for ( let y = height - 1; y >= 0; y -- ) {

			for ( let x = 0; x < width; x ++ ) {

				// get the camera ray
				ssPoint.set( randomOffsetX + x / ( width - 1 ), randomOffsetY + y / ( height - 1 ) );
				raycaster.setFromCamera( { x: ssPoint.x * 2 - 1, y: ssPoint.y * 2 - 1 }, camera );

				// run the path trace
				radianceColor.set( 0 );
				pathTrace( raycaster.ray, radianceColor );

				// accumulate a rolling average color into the data texture
				const index = ( y * width + x ) * 4;
				const r = data[ index + 0 ];
				const g = data[ index + 1 ];
				const b = data[ index + 2 ];
				data[ index + 0 ] += ( radianceColor.r - r ) / ( samples + 1 );
				data[ index + 1 ] += ( radianceColor.g - g ) / ( samples + 1 );
				data[ index + 2 ] += ( radianceColor.b - b ) / ( samples + 1 );
				data[ index + 3 ] = 1.0;

				// if we've rendered for ~16ms then wait for the next tick
				const delta = performance.now() - lastStartTime;
				if ( delta > 16 ) {

					computationTime += delta;
					scanLinePercent = 100 * y / height;

					yield;
					lastStartTime = performance.now();

				}

			}

		}

		samples ++;

	}

	function expandHitInformation( hit, ray ) {

		const object = hit.object;
		const posAttr = object.geometry.attributes.position;
		const normalAttr = object.geometry.attributes.normal;
		const materialAttr = object.geometry.attributes.materialIndex;

		const face = hit.face;
		const geometryNormal = hit.face.normal;
		if ( smoothNormals ) {

			const point = hit.point;
			triangle.a.fromBufferAttribute( posAttr, face.a );
			triangle.b.fromBufferAttribute( posAttr, face.b );
			triangle.c.fromBufferAttribute( posAttr, face.c );

			normal0.fromBufferAttribute( normalAttr, face.a );
			normal1.fromBufferAttribute( normalAttr, face.b );
			normal2.fromBufferAttribute( normalAttr, face.c );

			triangle.getBarycoord( point, barycoord );

			normal
				.setScalar( 0 )
				.addScaledVector( normal0, barycoord.x )
				.addScaledVector( normal1, barycoord.y )
				.addScaledVector( normal2, barycoord.z );

		} else {

			normal.copy( geometryNormal );

		}

		geometryNormal.transformDirection( object.matrixWorld );
		normal.transformDirection( object.matrixWorld );

		const hitFrontFace = geometryNormal.dot( ray.direction ) < 0;
		if ( ! hitFrontFace ) {

			normal.multiplyScalar( - 1 );
			geometryNormal.multiplyScalar( - 1 );

		}

		let material = object.material;
		if ( materialAttr ) {

			const materialIndex = materialAttr.getX( face.a );
			material = materials[ materialIndex ];

		}

		hit.material = material;
		hit.normal = normal;
		hit.geometryNormal = geometryNormal;
		hit.frontFace = hitFrontFace;

		normal.normalize();

	}

	// trace a path starting at the given ray
	function pathTrace( ray, targetColor ) {

		let currentRay = ray;
		throughputColor.set( 0xffffff );
		for ( let i = 0; i < bounces; i ++ ) {

			// get the ray intersection
			let hit;
			raycaster.ray.copy( currentRay );

			const objects = [ mesh ];
			if ( params.light.enable ) {

				objects.push( lightMesh );

			}

			if ( params.floor.enable ) {

				objects.push( floorMesh );

			}

			hit = raycaster.intersectObjects( objects, true )[ 0 ];

			// check if we hit the light or the model
			if ( hit ) {

				if ( hit.object === lightMesh ) {

					// TODO: is it correct to attenuate on the cosine of the hit direction?
					const weight = Math.max( - currentRay.direction.dot( lightForward ), 0.0 );
					targetColor.r += weight * throughputColor.r * lightMesh.material.color.r;
					targetColor.g += weight * throughputColor.g * lightMesh.material.color.g;
					targetColor.b += weight * throughputColor.b * lightMesh.material.color.b;
					break;

				} else {

					expandHitInformation( hit, currentRay );
					const { material } = hit;
					const nextRay = rayStack[ i ];

					// /* Direct Light Sampling */
					// // get a random point on the surface of the light
					// tempVector
					// 	.set( Math.random() - 0.5, Math.random() - 0.5, 0 )
					// 	.applyMatrix4( lightMesh.matrixWorld );

					// // get a ray to the light point
					// nextRay.origin.copy( hit.point ).addScaledVector( nextRay.direction, EPSILON );
					// nextRay.direction.subVectors( tempVector, nextRay.origin ).normalize();

					// // compute the probability of hitting the light on the hemisphere
					// const lightAttenuation =
					// 	Math.max( 0.0, hit.normal.dot( nextRay.direction ) ) *
					// 	Math.max( 0.0, - lightForward.dot( nextRay.direction ) );

					// // TODO: we should leave this attenuation check up to the PDF of a sample -- what about transmission?
					// if ( lightAttenuation > 0 ) {

					// 	const lightArea = lightWidth * lightHeight;
					// 	const lightPdf =
					// 		nextRay.origin.distanceToSquared( tempVector ) / (
					// 			Math.max( 0.0, hit.normal.dot( nextRay.direction ) ) *
					// 			Math.max( 0.0, - lightForward.dot( nextRay.direction ) ) *
					// 			lightArea
					// 		);

					// 	raycaster.ray.copy( nextRay );
					// 	const shadowHit = raycaster.intersectObjects( objects, true )[ 0 ];
					// 	if ( shadowHit && shadowHit.object === lightMesh ) {

					// 		// TODO
					// 		// - get the BSDF PDF for this direction
					// 		// - get the BSDF color for this direction
					// 		// - weight the PDF for this sample by the average of the two PDFs for this direction
					// 		// - add light output
					// 		// - continue to accumulate throughput based on surface quality to multiply here and
					// 		// continue to check for direct lighting / skybox to weight in the other direction
					// 		// (is that the same as MIS?)

					// 		const weight = hit.normal.dot( nextRay.direction ) * - lightForward.dot( nextRay.direction );
					// 		targetColor.r += lightMesh.material.color.r * material.color.r * weight / lightPdf;
					// 		targetColor.g += lightMesh.material.color.g * material.color.g * weight / lightPdf;
					// 		targetColor.b += lightMesh.material.color.b * material.color.b * weight / lightPdf;

					// 	}

					// }

					// break;

					/* BSDF Sampling */
					// compute the outgoing vector (towards the camera) to feed into the bsdf to get the
					// incident light vector.
					getBasisFromNormal( hit.normal, normalBasis );
					invBasis.copy( normalBasis ).invert();
					localDirection.copy( currentRay.direction ).applyMatrix4( invBasis ).multiplyScalar( - 1 ).normalize();

					// sample the surface to get the pdf, reflected color, and direction
					bsdfSample( localDirection, hit, material, sampleInfo );

					// transform ray back to world frame and offset from surface
					nextRay.direction.copy( sampleInfo.direction ).applyMatrix4( normalBasis ).normalize();
					nextRay.origin.copy( hit.point );
					if ( nextRay.direction.dot( hit.geometryNormal ) < 0 ) {

						nextRay.origin.addScaledVector( hit.geometryNormal, - EPSILON );

					} else {

						nextRay.origin.addScaledVector( hit.geometryNormal, EPSILON );

					}

					const { emissive, emissiveIntensity } = material;
					targetColor.r += ( emissiveIntensity * emissive.r * throughputColor.r );
					targetColor.g += ( emissiveIntensity * emissive.g * throughputColor.g );
					targetColor.b += ( emissiveIntensity * emissive.b * throughputColor.b );

					// If our PDF indicates there's a less than 0 probability of sampling this direction then
					// don't include it in our sampling and terminate the ray modeling that the ray has been absorbed.
					if ( sampleInfo.pdf <= 0 ) {

						break;

					}

					sampleInfo.color.multiplyScalar( 1 / sampleInfo.pdf );
					throughputColor.multiply( sampleInfo.color );
					currentRay = nextRay;

				}

			} else {

				sampleSkyBox( currentRay.direction, tempColor );
				tempColor.multiply( throughputColor );
				targetColor.add( tempColor );
				break;

			}

		}

	}

	// sample the skybox in the given direction and put the sampled color into "target"
	function sampleSkyBox( direction, target ) {

		if ( skyMode === 'checkerboard' ) {

			spherical.setFromVector3( direction );

			const angleStep = Math.PI / 10;
			const thetaEven = Math.floor( spherical.theta / angleStep ) % 2 === 0;
			const phiEven = Math.floor( spherical.phi / angleStep ) % 2 === 0;
			const isBlack = thetaEven === phiEven;
			target.set( isBlack ? 0 : 0xffffff ).multiplyScalar( 1.5 );
			target.multiplyScalar( skyIntensity );

		} else if ( skyMode === 'sun' ) {

			normal0.setScalar( 1 ).normalize();

			let value = Math.max( 0.0, direction.dot( normal0 ) + 1.0 ) / 2.0;
			value *= value;
			target.r = THREE.MathUtils.lerp( 0.01, 0.5, value );
			target.g = THREE.MathUtils.lerp( 0.01, 0.7, value );
			target.b = THREE.MathUtils.lerp( 0.01, 1.0, value );

			if ( value > 0.95 ) {

				let value2 = ( value - 0.95 ) / 0.05;
				value2 *= value2;
				target.r = THREE.MathUtils.lerp( 0.5, 10.0, value2 );
				target.g = THREE.MathUtils.lerp( 0.7, 10.0, value2 );
				target.b = THREE.MathUtils.lerp( 1.0, 10.0, value2 );

			}

			target.multiplyScalar( skyIntensity );

		} else {

			const value = ( direction.y + 0.5 ) / 2.0;
			target.r = THREE.MathUtils.lerp( 1.0, 0.5, value );
			target.g = THREE.MathUtils.lerp( 1.0, 0.7, value );
			target.b = THREE.MathUtils.lerp( 1.0, 1.0, value );
			target.multiplyScalar( skyIntensity );

		}

	}

}

function toHumanReadableTime( ms ) {

	ms = ms || 0;

	let seconds = ms * 1e-3;
	const minutes = Math.floor( seconds / 60 );
	seconds = seconds - minutes * 60;

	const minutesString = ( minutes < 10 ? '0' : '' ) + minutes;
	const secondsString = ( seconds < 10 ? '0' : '' ) + seconds.toFixed( 3 );

	return `${ minutesString }m ${ secondsString }s`;

}

function render() {

	requestAnimationFrame( render );

	for ( const key in models ) {

		if ( models[ key ] ) {

			models[ key ].mesh.visible = false;

		}

	}

	// select the model and initialize set the 0 material with the user settings
	if ( models[ params.model ] ) {

		const model = models[ params.model ];
		model.mesh.visible = true;
		mesh = model.mesh;
		materials = model.materials;
		floorMesh.position.y = model.floorHeight || 0;

		// initialize ior and transmission not present on materials already
		materials.forEach( m => {

			if ( m.ior === undefined ) m.ior = 1;
			if ( m.transmission === undefined ) m.transmission = 0.0;

		} );

		const material = materials[ 0 ];
		material.color.set( params.material.color ).convertSRGBToLinear();
		material.emissive.set( params.material.emissive ).convertSRGBToLinear();
		material.emissiveIntensity = parseFloat( params.material.emissiveIntensity );
		material.ior = parseFloat( params.material.ior );
		material.metalness = parseFloat( params.material.metalness );
		material.transmission = parseFloat( params.material.transmission );

		// use a "perceptualRoughness" concept when interpreting user input
		// https://google.github.io/filament/Filament.html#materialsystem/standardmodelsummary
		material.roughness = Math.pow( parseFloat( params.material.roughness ), 2.0 );

	} else {

		mesh = null;
		materials = null;
		floorMesh.position.y = 0;

	}

	let fade = 0;
	if ( delay > FADE_DELAY ) {

		fade = Math.min( ( delay - FADE_DELAY ) / ( DELAY_TIME - FADE_DELAY ), 1.0 );

	}

	fsQuad.material.map = dataTexture;
	fsQuad.material.opacity = fade;
	scanLineElement.style.bottom = `${ scanLinePercent }%`;
	if ( params.resolution.stretchImage ) {

		scanLineElement.style.borderBottomWidth = `${ Math.pow( 2, params.resolution.resolutionScale - 1 ) }px`;

	} else {

		scanLineElement.style.borderBottomWidth = '1px';

	}

	renderer.render( scene, camera );
	renderer.autoClear = false;
	fsQuad.render( renderer );
	renderer.autoClear = true;

	// run the path tracing
	// world matrices are up to date because of the above render
	if ( mesh && ! params.pathTracing.pause ) {

		task.next();

	}

	// force the data texture to upload now that it's changed but do it after render so the
	// upload happens asynchronously and will be ready next frame.
	dataTexture.needsUpdate = true;
	renderer.compile( fsQuad._mesh );

	// count down the fade
	if ( delay < DELAY_TIME ) {

		delay += clock.getDelta() * 1e3;

	}

	outputContainer.innerText =
		`completed samples : ${ samples }\n` +
		`computation time  : ${ toHumanReadableTime( computationTime ) }\n` +
		`elapsed time      : ${ toHumanReadableTime( performance.now() - renderStartTime ) }`;

}

