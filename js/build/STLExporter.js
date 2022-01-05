/**
 * @author kovacsv / http://kovacsv.hu/
 * @author mrdoob / http://mrdoob.com/
 * @author mudcube / http://mudcu.be/
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Usage:
 *  var exporter = new THREE.STLExporter();
 *
 *  // second argument is a list of options
 *  var data = exporter.parse( mesh, { binary: true } );
 *
 */

THREE.STLExporter = function () {};

THREE.STLExporter.prototype = {

    constructor: THREE.STLExporter,

    parse: ( function () {

        var vector = new THREE.Vector3();
        var normalMatrixWorld = new THREE.Matrix3();

        return function parse( object, options ) {

            if ( options === undefined ) options = {};

            var binary = options.binary !== undefined ? options.binary : false;

            //

            var objects = [];
            var triangles = 0;

            var output = '';

            output += 'solid exported\n';

            // for ( var i = 0, il = objects.length; i < il; i ++ ) {
            //
            //     var object = objects[ i ];

                var vertices = object.geometry.vertices;
                var faces = object.geometry.faces;
                var matrixWorld = object.matrixWorld;

                normalMatrixWorld.getNormalMatrix( matrixWorld );

                for ( var j = 0, jl = faces.length; j < jl; j ++ ) {

                    var face = faces[ j ];

                    vector.copy( face.normal ).applyMatrix3( normalMatrixWorld ).normalize();

                    output += '\tfacet normal ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';
                    output += '\t\touter loop\n';

                    var indices = [ face.a, face.b, face.c ];

                    for ( var k = 0; k < 3; k ++ ) {

                        vector.copy( vertices[ indices[ k ] ] ).applyMatrix4( matrixWorld );

                        output += '\t\t\tvertex ' + vector.x + ' ' + vector.y + ' ' + vector.z + '\n';

                    }

                    output += '\t\tendloop\n';
                    output += '\tendfacet\n';

                }

            // }

            output += 'endsolid exported\n';
            return output;


        };

    }() )

};